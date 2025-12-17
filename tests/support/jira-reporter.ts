import fs from 'fs';
import path from 'path';
import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type JiraEnv = {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[jira-reporter] Missing required env var: ${name}`);
  return v;
}

function getJiraEnv(): JiraEnv {
  return {
    baseUrl: requiredEnv('JIRA_BASE_URL').replace(/\/+$/, ''),
    email: requiredEnv('JIRA_EMAIL'),
    apiToken: requiredEnv('JIRA_API_TOKEN'),
    projectKey: requiredEnv('JIRA_PROJECT_KEY'),
    issueType: process.env.JIRA_ISSUE_TYPE || 'Bug',
  };
}

function basicAuthHeader(email: string, token: string): string {
  const raw = `${email}:${token}`;
  return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
}

function toPlainTextDescription(params: {
  testTitle: string;
  specFile: string;
  projectName?: string;
  durationMs?: number;
  errorText: string;
  stdout: string;
  stderr: string;
}): string {
  const { testTitle, specFile, projectName, durationMs, errorText, stdout, stderr } = params;
  return [
    `Automated bug created by Playwright.`,
    ``,
    `== Summary ==`,
    `Failed test: ${testTitle}`,
    `Suite file: ${specFile}`,
    projectName ? `Project: ${projectName}` : undefined,
    typeof durationMs === 'number' ? `Duration: ${durationMs} ms` : undefined,
    ``,
    `== Error ==`,
    errorText || '(no error text)',
    ``,
    `== Playwright stdout ==`,
    stdout || '(empty)',
    ``,
    `== Playwright stderr ==`,
    stderr || '(empty)',
  ]
    .filter(Boolean)
    .join('\n');
}

function stripAnsi(input: string): string {
  // Matches most ANSI escape codes used for coloring/styling terminal output.
  // Example sequences seen in Playwright errors: \u001b[2m, \u001b[31m, \u001b[39m
  // eslint-disable-next-line no-control-regex
  return input.replace(/\u001b\[[0-9;]*m/g, '');
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars)}\n\n[truncated to ${maxChars} chars]`;
}

async function jiraCreateIssue(env: JiraEnv, summary: string, description: string): Promise<string> {
  const url = `${env.baseUrl}/rest/api/2/issue`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(env.email, env.apiToken),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: env.projectKey },
        issuetype: { name: env.issueType },
        summary,
        description,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[jira-reporter] Failed to create issue (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { key?: string };
  if (!json.key) throw new Error('[jira-reporter] Jira create issue returned no key');
  return json.key;
}

async function jiraAttachFile(env: JiraEnv, issueKey: string, filePath: string): Promise<void> {
  const url = `${env.baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/attachments`;
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);

  // Node 18+ provides fetch + FormData + Blob.
  const form = new FormData();
  form.append('file', new Blob([buffer]), fileName);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(env.email, env.apiToken),
      Accept: 'application/json',
      // Required by Jira Cloud for attachments:
      'X-Atlassian-Token': 'no-check',
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `[jira-reporter] Failed to attach file "${fileName}" to ${issueKey} (${res.status}): ${body}`,
    );
  }
}

function getSpecFile(test: TestCase): string {
  const loc = test.location;
  if (!loc?.file) return '(unknown spec file)';
  return path.normalize(loc.file).replace(/\\/g, '/').split('/').pop() || loc.file;
}

function stringifyError(result: TestResult): string {
  const err = result.error;
  if (!err) return '';
  return [err.message, err.stack].filter(Boolean).join('\n');
}

function stringifyStdIO(chunks: Array<string | Buffer>): string {
  return chunks.map((c) => (Buffer.isBuffer(c) ? c.toString('utf8') : c)).join('');
}

export default class JiraReporter implements Reporter {
  private config?: FullConfig;
  private env?: JiraEnv;

  async onBegin(config: FullConfig, _suite: Suite) {
    this.config = config;
    // Only initialize Jira if the required vars exist.
    // If missing, we skip reporter to avoid breaking local runs.
    const hasAll =
      process.env.JIRA_BASE_URL &&
      process.env.JIRA_EMAIL &&
      process.env.JIRA_API_TOKEN &&
      process.env.JIRA_PROJECT_KEY;
    if (hasAll) this.env = getJiraEnv();
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    if (!this.env) return;
    if (result.status !== 'failed') return;

    try {
      const specFile = getSpecFile(test);
      const testTitle = test.titlePath().join(' > ');
      const summary = `Playwright failure: ${test.title}`;

      const stdout = stringifyStdIO(result.stdout || []);
      const stderr = stringifyStdIO(result.stderr || []);
      const errorText = stringifyError(result);

      const description = toPlainTextDescription({
        testTitle,
        specFile,
        projectName: this.config?.projects?.[0]?.name,
        durationMs: result.duration,
        errorText: truncate(stripAnsi(errorText), 20000),
        stdout: truncate(stripAnsi(stdout), 20000),
        stderr: truncate(stripAnsi(stderr), 20000),
      });

      const issueKey = await jiraCreateIssue(this.env, summary, description);

      // Attach all Playwright attachments that have a file path (screenshot/video/trace/etc).
      // Playwright typically provides them on failure when configured.
      const fileAttachments = (result.attachments || []).filter((a) => a.path && fs.existsSync(a.path));
      for (const att of fileAttachments) {
        // Defensive: only upload files we can read.
        try {
          await jiraAttachFile(this.env, issueKey, att.path!);
        } catch (e) {
          // Do not fail the whole test run if an attachment upload fails.
          // The bug is already created with details; attachment can be investigated separately.
          console.warn(String(e));
        }
      }

      console.log(`[jira-reporter] Created Jira issue ${issueKey} for failed test: ${test.title}`);
    } catch (e) {
      // Never crash the test run due to Jira integration issues.
      console.warn(`[jira-reporter] Jira integration failed: ${String(e)}`);
    }
  }
}


