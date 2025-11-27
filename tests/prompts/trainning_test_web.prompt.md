# 🧪 Official Prompt – WEB Test Documentation (Playwright) – Notes Application

You are an SDET specializing in **E2E Web testing with Playwright**, following the architecture demonstrated in the example test below:

- Uses Faker to generate dynamic test data.
- Generates individual fixtures per execution using:
  `faker.finance.creditCardNumber()`
- Saves fixtures at:  
  `tests/fixtures/testdata-<random>.json`
- Consumes fixture data in **custom commands** located at:  
  `tests/support/commands`
- Always performs full cleanup: login → delete user → delete fixture.

Use as a reference the following model test: Creates a new user account via WEB @WEB @BASIC @FULL

# 📄 Test Documentation – Notes Application (Expand Testing)

## 🌐 Environment and Test Data

### System URL
- **Test Environment:** `https://practice.expandtesting.com/notes/app`  
- Playwright navigates using: `page.goto('app')` and `page.goto('app/register')`

---

## 👤 Test Data – Dynamic Fixtures

All tests must generate dynamic data using Faker:

- `user_name: faker.person.fullName()`
- `user_email: faker.internet.exampleEmail().toLowerCase()`
- `user_password: faker.internet.password({ length: 8 })`
- `fixtureKey: faker.finance.creditCardNumber()`

### 📌 Mandatory Rules
Each test must:

1. Generate a unique number using `faker.finance.creditCardNumber()`.
2. Create a fixture file: `tests/fixtures/testdata-<fixtureKey>.json`


3. Store in the fixture:
   - user_email  
   - user_name  
   - user_password  
   - user_id (obtained from CU intercept)

4. Consume the fixture in custom commands:
   - `logInUserViaWeb(page, fixtureKey)`
   - `deleteUserViaWeb(page)`
   - `deleteJsonFile(fixtureKey)`

---

# 🧪 WEB Test Cases (Registration, Login, Profile, Deletion)

The structure below is designed to automate the tests following **exactly the same architecture as the model test**.

---

# CT001 – Successful User Registration (WEB)

### 🎯 Objective
Validate the complete user registration flow via the Web interface.

### 🔧 Preconditions
– No existing user with the generated email.  
– Fixture must be created with a unique Faker number.  
– After registration, the user must be authenticated and deleted via **custom commands**.

---

### 📝 Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `app/register`. | Registration page loads. |
| 2 | Fill **Email** with dynamic faker email. | Field is filled. |
| 3 | Fill **Username** with faker. | Field is filled. |
| 4 | Fill **Password** and **Confirm Password** with faker. | Fields are filled. |
| 5 | Intercept the user creation endpoint with `getFullFilledResponseCU(page)`. | Response captured. |
| 6 | Click **Register**. | Request is sent. |
| 7 | Read intercepted JSON and capture `responseBody.data.id`. | ID obtained successfully. |
| 8 | Save data in fixture: `tests/fixtures/testdata-<fixtureKey>.json`. | Fixture created. |
| 9 | Validate Web message: **“User account created successfully”**. | Message is visible. |
| 10 | Perform login using `logInUserViaWeb(page, fixtureKey)`. | Login successful. |
| 11 | Delete user using `deleteUserViaWeb(page)`. | Account removed. |
| 12 | Delete fixture using `deleteJsonFile(fixtureKey)`. | Fixture removed. |

---

# CT002 – Successful Login (WEB)

### 🎯 Objective
Verify that a user created in CT001 can log in via Web.

### 🔧 Preconditions
– User fixture must exist in `tests/fixtures`.  
– Login must use `logInUserViaWeb(page, fixtureKey)`.  
– After the test, user and fixture must be removed.

---

### 📝 Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Execute `logInUserViaWeb(page, fixtureKey)`. | Login successful. |
| 2 | Validate redirection to **MyNotes**. | Page visible. |
| 3 | Validate presence of **Logout** and **Profile** buttons. | Elements visible. |
| 4 | Validate title: **“MyNotes”**. | Title displayed. |
| 5 | Validate initial message: **“You don't have any notes in all categories”**. | Message correct. |
| 6 | Cleanup: `deleteUserViaWeb(page)` + `deleteJsonFile(fixtureKey)`. | Environment clean. |

---

# CT003 – Profile Data Validation (WEB)

### 🎯 Objective
Ensure that the user profile displays the same data stored in the fixture.

### 🔧 Preconditions
– User logged in via `logInUserViaWeb(page, fixtureKey)`.  
– User data read from fixture generated in CT001.

---

### 📝 Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **Profile**. | Profile page opens. |
| 2 | Validate Username with `fixture.user_name`. | Name matches. |
| 3 | Validate Email with `fixture.user_email`. | Email matches. |
| 4 | Cleanup: `deleteUserViaWeb(page)` + `deleteJsonFile(fixtureKey)`. | User removed, fixture deleted. |

---

# CT004 – User Deletion (Cleanup)

### 🎯 Objective
Validate the user deletion flow via Web interface.

### 🔧 Preconditions
– User logged in via `logInUserViaWeb(page, fixtureKey)`.

---

### 📝 Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **Profile**. | Profile tab displayed. |
| 2 | Click **Delete Account**. | Confirmation modal displayed. |
| 3 | Confirm **Delete**. | Account removed. |
| 4 | Validate message: **“Your account has been deleted. You should create a new account to continue.”** | Message visible. |
| 5 | Validate redirection to login page. | Login screen loads. |
| 6 | Delete fixture via `deleteJsonFile(fixtureKey)` if exists. | Fixture removed. |

---

# 📌 Mandatory Rules for All WEB Tests

✔ Generate unique fixture using `faker.finance.creditCardNumber()`  
✔ Save fixture in `tests/fixtures/testdata-<fixtureKey>.json`  
✔ Never reuse fixture between tests (each test creates and deletes its own)  
✔ Use exclusively **custom commands** for:
- User creation (if applicable)  
- Login via Web  
- Deletion via Web  
- Reading/removing fixture  

✔ All tests must end with mandatory cleanup.
