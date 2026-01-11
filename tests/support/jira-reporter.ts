import fs from 'fs';
import path from 'path';
import type {
  FullConfig,
  FullResult,
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

async function jiraCreateIssue(env: JiraEnv, summary: string, description: string, labels?: string[]): Promise<string> {
  const url = `${env.baseUrl}/rest/api/2/issue`;
  const payload = {
    fields: {
      project: { key: env.projectKey },
      issuetype: { name: env.issueType },
      summary,
      description,
      labels: labels && labels.length ? labels : undefined,
    },
  };
  console.log(`[jira-reporter] Creating issue with labels: ${labels?.join(', ') || '(none)'}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(env.email, env.apiToken),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
  const fileBuffer = fs.readFileSync(filePath);

  // Use multipart/form-data for file upload as per Jira API spec.
  // Node.js FormData will automatically set Content-Type header with boundary.
  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: 'application/octet-stream' }), fileName);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(env.email, env.apiToken),
      // Required by Jira Cloud for attachments - tells Jira to accept file without CSRF check
      'X-Atlassian-Token': 'no-check',
    },
    body: form,
    // Do NOT set Content-Type; fetch + FormData will set it with correct boundary
  });

  console.log(`[jira-reporter] Attachment response for ${fileName}: ${res.status}`);
  
  if (!res.ok) {
    let body = '';
    try {
      body = await res.text();
    } catch {
      body = '(could not read response)';
    }
    throw new Error(
      `[jira-reporter] Failed to attach file "${fileName}" to ${issueKey} (${res.status}): ${body}`,
    );
  }
  
  console.log(`[jira-reporter] Successfully attached "${fileName}" to ${issueKey}`);
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

function collectLabels(test: TestCase): string[] {
  const labels = new Set<string>();

  // Always include automation markers
  labels.add('automated-test');
  labels.add('playwright');

  // Project (browser) label for traceability
  try {
    const projectName = (test as any).project?.() ? (test as any).project().name : undefined;
    if (projectName) labels.add(projectName.toLowerCase());
  } catch {
    // ignore
  }

  // Extract tags from title path (captures @API, @WEB, @API_AND_WEB, @BASIC, @FULL, @NEGATIVE, etc.)
  const titleText = test.titlePath().join(' ');
  const tagRegex = /@([A-Z_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(titleText)) !== null) {
    const tag = match[1];
    switch (tag) {
      case 'API':
        labels.add('api-test');
        break;
      case 'WEB':
        labels.add('web-test');
        break;
      case 'API_AND_WEB':
        labels.add('api-test');
        labels.add('web-test');
        break;
      default:
        // Ignore other tags (e.g., BASIC/FULL/NEGATIVE) per request
        break;
    }
  }

  return Array.from(labels);
}

export default class JiraReporter implements Reporter {
  private config?: FullConfig;
  private env?: JiraEnv;
  private createdIssues: string[] = [];

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

      const labels = collectLabels(test);
      console.log(`[jira-reporter] Labels for issue: ${labels.join(', ') || '(none)'}`);

      const description = toPlainTextDescription({
        testTitle,
        specFile,
        projectName: this.config?.projects?.[0]?.name,
        durationMs: result.duration,
        errorText: truncate(stripAnsi(errorText), 20000),
        stdout: truncate(stripAnsi(stdout), 20000),
        stderr: truncate(stripAnsi(stderr), 20000),
      });

      const issueKey = await jiraCreateIssue(this.env, summary, description, labels);
      this.createdIssues.push(issueKey);

      // Attach a lightweight text summary (helps when no Playwright artifacts are generated, e.g., API-only tests).
      try {
        const summaryDir = path.join(process.cwd(), 'test-results');
        fs.mkdirSync(summaryDir, { recursive: true });
        const summaryPath = path.join(summaryDir, `jira-${issueKey}.txt`);
        const summaryText = [
          `Issue: ${issueKey}`,
          `Test: ${testTitle}`,
          `Spec: ${specFile}`,
          `Project: ${this.config?.projects?.[0]?.name || ''}`,
          `DurationMs: ${result.duration}`,
          `Status: ${result.status}`,
          '',
          'Error:',
          truncate(stripAnsi(errorText), 2000) || '(none)',
          '',
          'Stdout:',
          truncate(stripAnsi(stdout), 2000) || '(empty)',
          '',
          'Stderr:',
          truncate(stripAnsi(stderr), 2000) || '(empty)',
        ].join('\n');
        fs.writeFileSync(summaryPath, summaryText, 'utf8');
        await jiraAttachFile(this.env, issueKey, summaryPath);
      } catch (e) {
        console.warn(`[jira-reporter] Failed to attach summary file: ${String(e)}`);
      }

      // Attach Playwright HTML report entry point if available (common for both UI and API runs).
      try {
        const reportPath = path.join(process.cwd(), 'playwright-report', 'index.html');
        if (fs.existsSync(reportPath)) {
          await jiraAttachFile(this.env, issueKey, reportPath);
        }
      } catch (e) {
        console.warn(`[jira-reporter] Failed to attach HTML report: ${String(e)}`);
      }

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

  async onEnd(result: FullResult) {
    if (!this.env || this.createdIssues.length === 0) return;

    // After all tests complete, the Playwright HTML report is generated.
    // Attach it to all created issues.
    const reportPath = path.join(process.cwd(), 'playwright-report', 'index.html');
    if (!fs.existsSync(reportPath)) {
      console.log('[jira-reporter] Playwright HTML report not generated; skipping attachment.');
      return;
    }

    for (const issueKey of this.createdIssues) {
      try {
        await jiraAttachFile(this.env, issueKey, reportPath);
        console.log(`[jira-reporter] Attached Playwright HTML report to ${issueKey}`);
      } catch (e) {
        console.warn(`[jira-reporter] Failed to attach report to ${issueKey}: ${String(e)}`);
      }
    }
  }
}


