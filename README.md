# playwright-and-mcp-expandtesting_api_and_web

API and WEB testing in [expandtesting](https://practice.expandtesting.com/notes/app/) note app. This project contains basic examples on how to use playwright-mcp to test API, WEB and how to combine API and WEB tests. Good practices such as AI prompting, Generative AI, AI debugging, hooks, custom commands and tags, among others, are used. All the necessary support documentation to develop this project is placed here. When it comes to the API part, it deals with the x-www-form-urlencoded content type.

# Pre-requirements:

| Requirement                   | Version  | Note                                                            |
| :---------------------------- |:---------| :---------------------------------------------------------------|
| Cursor                        | 2.1      | -                                                               |
| npm                           | 10.9.2   | -                                                               |
| Playwright                    | 1.57.0   | -                                                               |
| Playwright Test for VSCode    | 1.1.15   | -                                                               |
| Faker                         | 10.1.0   | -                                                               | 
| dotenv                        | 17.2.3   | -                                                               |              

# Installation:

- See [Cursor download page](https://cursor.com/download), download and install the latest Cursor stable version. Keep all the prefereced options as they are until you reach the possibility to check the checkboxes below: 
  - :white_check_mark: Add "Open with Cursor" action to Windows Explorer file context menu. 
  - :white_check_mark: Add "Open with Cursor" action to Windows Explorer directory context menu.
Check then both to add both options in context menu.
Open Cursor and hit :point_right:**File**, :point_right:**Preferences**, :point_right:**Cursor Settings**, :point_right:**Add Custom MCP** and paste the below configuration: 
    ```
    {
      "mcpServers": {
        "playwright": {
          "command": "npx",
          "args": [
            "@playwright/mcp@latest"
          ]
        }
      }
    }
    ```
  On Toggle AI Pane, :point_right:**Auto** in the model selection drop-down menu.
  Look for Playwright Test for VSCode in the extensions marketplace and install the one from Microsoft.
- See [Node.js page](https://nodejs.org/en) and install the aforementioned Node.js version. Keep all the preferenced options as they are.
- Execute ```npm init playwright@latest``` to start a project.
  - Hit :point_right:**Enter** to Install Playwright on its latests version.
  - Hit :point_right:**Enter** to select TypeScript.
  - Hit :point_right:**Enter** to put your end-to-end tests in \tests.
  - Hit :point_right:**y** to add a GitHub Actions workflow.
  - Hit :point_right:**Enter** to install Playwright browsers.
- Look for Playwright Test for VSCode in the extensions marketplace and install the one from Microsoft.
- Execute ```npm install @faker-js/faker --save-dev``` to install faker library.
- Execute ```npm i -D dotenv``` to install dotenv module.
- See .env file and configure it as below, or customize it according to your project needs.
    ```
    JIRA_BASE_URL="https://your_project_url.atlassian.net"
    JIRA_EMAIL="your_email@xyz.com"
    JIRA_API_TOKEN="xxxxxx_your_api_token_xxxxxxxxxxxxx"
    JIRA_PROJECT_KEY="xxx_your_jira_project_key_xxxx"
    JIRA_ISSUE_TYPE="Bug"
    ```
  Contact your Jira admin to double check your API token permissions.

# Tests:

- When creating automated web test, drag both general_web_test_runner.prompt.md and trainning_web_est.prompt.md to the typing area in Cursor. Wait for the test cases to be designed and codified into spec.ts files. Type "Execute trainning_test_web.prompt.md" and hit :arrow_up:. After the execution is finished, input different parameters so the other test cases can be generated. Use equivalents files for automated api tests. 
- Execute ```npx playwright test --ui``` to run your tests with UI Mode. 
- Execute ```npx playwright test``` to execute playwright in headless mode.
- Hit :point_right:**Testing** button on left side bar in VSC and choose the tests you want to execute.
- Execute ```npx playwright test --grep "@BASIC"``` to run the tests tagged with BASIC tag in Powershell.
- Execute ```npx playwright test --grep-invert "@NEGATIVE"``` to run the tests not tagged with NEGATIVE tag in Powershell.
- Execute ```npx playwright test --grep-invert "(?=.*@API)(?=.*@FULL)"``` to run the tests tagged with both API and FULL tags in Powershell.
- Execute ```npx playwright test --grep "TC001"``` to run a specific test by its TC number (e.g., TC001, TC640, etc.) in Powershell. If the test fails, a bug is automatically created in Jira and linked to the configured EPIC.

# Support:

- [playwright-mcp](https://github.com/microsoft/playwright-mcp)
- [expandtesting API documentation page](https://practice.expandtesting.com/notes/api/api-docs/)
- [expandtesting API demonstration page](https://www.youtube.com/watch?v=bQYvS6EEBZc)
- [Faker](https://fakerjs.dev/guide/)
- [Playwright docs](https://playwright.dev/docs/intro)
- [Read/Write JSON Files with Node.js](https://heynode.com/tutorial/readwrite-json-files-nodejs/?utm_source=youtube&utm_medium=referral+&utm_campaign=YT+description&utm_content=read-write-json-iles-with-nodejs)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Use array of keywords and loop through script in Playwright](https://stackoverflow.com/a/69402975/10519428)
- [How to Delete a File From a Directory with Node.js](https://coderrocketfuel.com/article/how-to-delete-a-file-from-a-directory-with-node-js)
- [How to resolve Node.js: "Error: ENOENT: no such file or directory"](https://stackoverflow.com/a/62363729/10519428)
- [trying to click a button on playwright](https://stackoverflow.com/a/71712111/10519428)
- [How to wait for a specific API response in your Playwright end-to-end tests](https://www.youtube.com/watch?v=5CER0dKweyw)
- [How to remove specific character surrounding a string?](https://stackoverflow.com/a/44537491/10519428)
- [reload](https://playwright.dev/docs/api/class-page#page-reload)
- [How to Check an Element's Value in Playwright](https://betterstack.com/community/questions/playwright-check-element-value/)
- [Tag tests](https://playwright.dev/docs/test-annotations#tag-tests)
- [[Feature]: Support Ubuntu 24.04 #30368](https://github.com/microsoft/playwright/issues/30368)

# Tips:

- API and WEB tests to send password reset link to user's email and API tests to verify a password reset token and reset a user's password must be tested manually as they rely on e-mail verification.
- Grep plugin helps filtering the test to be executed. Study the documentation. 
- For the first time using Cursor generative AI, is it recommended to:
  - Develop a basic functional playwright test case, 
  - Ask the chat GPT to create a trainning_test.prompt.md file for the basic functional playwright test case, 
  - Drag and drop both trainning (e.g. trainning_test_web_.prompt.md) and general runner (e.g. general_web_test_runner.prompt.md) files to the typing area and type "Execute trainning_test_web.prompt.md" and hit :arrow_up:. This way, Cursor will be trainned properly applying the general test parameters into the scope of the current application under test. 
