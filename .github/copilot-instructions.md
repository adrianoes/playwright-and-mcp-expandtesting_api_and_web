# Copilot / AI Agent Instructions — playwright_and_mcp-expandtesting_api_and_web

Purpose: provide concise, actionable context for AI coding agents to be immediately productive in this repo.

1) Big picture
- Tests are Playwright + TypeScript end-to-end and API tests. See test layout in `tests/` (subfolders: `api`, `web`, `api_and_web`, `fixtures`, `prompts`, `support`).
- Playwright config: [playwright.config.ts](playwright.config.ts) — `baseURL` set to the notes app and a custom Jira reporter is enabled.

2) Key workflows & commands
- Run tests (headless): `npx playwright test` (see `playwright.config.ts` reporter & retries).
- Run UI Mode: `npx playwright test --ui`.
- Run tagged tests: `npx playwright test --grep "@BASIC"` or `--grep-invert "@NEGATIVE"` (examples in README).
- Environment: repo loads `.env` (see [playwright.config.ts](playwright.config.ts)); Jira reporter requires `JIRA_*` vars. See [tests/support/jira-reporter.ts](tests/support/jira-reporter.ts).

3) Project-specific conventions (do not change)
- Test file naming: `<scope>_<mean>.spec.ts` (e.g. [tests/api/users_api.spec.ts](tests/api/users_api.spec.ts)).
- Test case IDs: every test includes a `TC` number with increments of 10 (TC010, TC020…). Preserve numbering and tags (`@API`, `@WEB`, `@BASIC`, `@FULL`, `@NEGATIVE`).
- Fixtures: tests write per-test JSON fixtures under `tests/fixtures/testdata-<random>.json` using a random key to support parallel runs. Use the same pattern when adding helpers (see [tests/support/commands.ts](tests/support/commands.ts)).
- Locator preference (web): 1) `getByRole()` 2) `getByLabel()` 3) `getByPlaceholder()` 4) `getByText()` 5) `getByTestId()` as last resort — examples in [tests/web/users_web.spec.ts](tests/web/users_web.spec.ts).

4) Patterns & anti-patterns
- Avoid custom timeouts; rely on Playwright auto-waiting. The repo explicitly forbids adding timeouts unless justified.
- Tests are independent and may run fully parallel (`fullyParallel: true`). When adding stateful flows, create and tear down per-test fixture files.
- Use Playwright native `expect(...)` assertions (auto-retry friendly). See many examples in `tests/*`.

5) Data generation
- Use `@faker-js/faker` helpers used across the codebase (examples in tests and `commands.ts`): `faker.person.fullName()`, `faker.internet.exampleEmail().toLowerCase()`, `faker.internet.password({ length: 8 })`, `faker.string.numeric(...)`, `faker.word.words(...)`, `faker.helpers.arrayElement(...)`.

6) Integration points
- Jira reporter: [tests/support/jira-reporter.ts](tests/support/jira-reporter.ts) — requires `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` in `.env`.
- Base app under test: `https://practice.expandtesting.com/notes/` (configured in [playwright.config.ts](playwright.config.ts)).

7) Prompting & generative workflows
- This repo includes Cursor/MCP prompt templates in `tests/prompts/` (`general_api_test_runner.prompt.md`, `general_web_test_runner.prompt.md`) used to drive automatic test generation — keep those files when updating prompt-driven flows.

8) Files to inspect first
- [playwright.config.ts](playwright.config.ts), [package.json](package.json), [README.md](README.md), [tests/support/commands.ts](tests/support/commands.ts), [tests/support/jira-reporter.ts](tests/support/jira-reporter.ts), `tests/prompts/`.

9) Typical quick fixes an AI can do here
- Add new tests following naming/TC conventions; create unique fixture keys; use helpers in `tests/support/commands.ts` for repeated flows; avoid adding global state.

If any section is unclear or you want more examples (specific tests, fixtures, or prompt usage), tell me which area to expand. Thank you — ready to iterate.
