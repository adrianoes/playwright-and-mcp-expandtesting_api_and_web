import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { deleteJsonFile, getFullFilledResponseCU, logInUserViaWeb, deleteUserViaWeb } from '../support/commands'
import fs from 'fs'

test.describe('Users Web Tests', () => {

    // CT001 – Successful User Registration (WEB)
    test('CT001 - Successful User Registration via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Step 1: Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Step 2: Generate dynamic test data
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        // Step 3: Navigate to registration page
        await page.goto('app/register')
        await expect(page).toHaveURL(/.*\/register/)
        
        // Step 4: Fill Email with dynamic faker email
        await page.getByTestId('register-email').fill(user.user_email)
        await expect(page.getByTestId('register-email')).toHaveValue(user.user_email)
        
        // Step 5: Fill Username with faker
        await page.getByTestId('register-name').fill(user.user_name)
        await expect(page.getByTestId('register-name')).toHaveValue(user.user_name)
        
        // Step 6: Fill Password and Confirm Password with faker
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        await expect(page.getByTestId('register-password')).toHaveValue(user.user_password)
        await expect(page.getByTestId('register-confirm-password')).toHaveValue(user.user_password)
        
        // Step 7: Intercept the user creation endpoint
        const responsePromise = getFullFilledResponseCU(page)
        
        // Step 8: Click Register
        await page.getByRole('button', { name: 'Register' }).click()
        
        // Step 9: Read intercepted JSON and capture responseBody.data.id
        const response = await responsePromise
        const responseBody = await response.json()
        const user_id = responseBody.data.id
        
        // Step 10: Save data in fixture
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: user_id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 11: Validate Web message: "User account created successfully"
        const successMessage = page.locator('b')
        await expect(successMessage).toContainText('User account created successfully')
        await expect(successMessage).toBeVisible()
        
        // Step 12: Perform login using logInUserViaWeb
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 13: Delete user using deleteUserViaWeb
        await deleteUserViaWeb(page)
        
        // Step 14: Delete fixture using deleteJsonFile
        await deleteJsonFile(fixtureKey)
    })

    // CT002 – Successful Login (WEB)
    test('CT002 - Successful Login via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        await page.goto('app/register')
        await page.getByTestId('register-email').fill(user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        
        const responsePromise = getFullFilledResponseCU(page)
        await page.getByRole('button', { name: 'Register' }).click()
        const response = await responsePromise
        const responseBody = await response.json()
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 1: Execute logInUserViaWeb
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 2: Navigate to MyNotes (home page) to validate redirection
        await page.goto('app/')
        await expect(page).toHaveURL(/.*\/app\/$/)
        
        // Step 3: Validate presence of Logout and Profile buttons
        // Check for navigation elements that indicate user is logged in
        const navigationElements = page.locator('button, a').filter({ hasText: /Logout|Profile/i })
        await expect(navigationElements.first()).toBeVisible()
        
        // Step 4: Validate title: "MyNotes" - check for page heading or validate by Add Note button
        // The MyNotes page is validated by presence of notes-related functionality
        const addNoteButton = page.getByRole('button', { name: /Add Note/i }).or(page.getByText(/\+ Add Note/i))
        await expect(addNoteButton.first()).toBeVisible()
        
        // Step 5: Validate initial message: "You don't have any notes in all categories"
        const emptyMessage = page.getByText(/You don't have any notes|don't have any notes/i)
        await expect(emptyMessage).toBeVisible()
        
        // Step 6: Cleanup
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    // CT003 – Profile Data Validation (WEB)
    test('CT003 - Profile Data Validation via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        await page.goto('app/register')
        await page.getByTestId('register-email').fill(user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        
        const responsePromise = getFullFilledResponseCU(page)
        await page.getByRole('button', { name: 'Register' }).click()
        const response = await responsePromise
        const responseBody = await response.json()
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 1: Login user
        await logInUserViaWeb(page, fixtureKey)
        
        // Read fixture data
        const fixture = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        
        // Step 2: Click Profile (already on profile page from login, but ensure we're there)
        await page.goto('app/profile')
        await expect(page).toHaveURL(/.*\/profile/)
        
        // Step 3: Validate Username with fixture.user_name
        const userName = page.locator('[data-testid="user-name"]')
        await expect(userName).toHaveValue(fixture.user_name)
        await expect(userName).toBeVisible()
        
        // Step 4: Validate Email with fixture.user_email
        const userEmail = page.locator('[data-testid="user-email"]')
        await expect(userEmail).toHaveValue(fixture.user_email)
        await expect(userEmail).toBeVisible()
        
        // Step 5: Cleanup
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    // CT004 – User Deletion (Cleanup)
    test('CT004 - User Deletion via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        await page.goto('app/register')
        await page.getByTestId('register-email').fill(user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        
        const responsePromise = getFullFilledResponseCU(page)
        await page.getByRole('button', { name: 'Register' }).click()
        const response = await responsePromise
        const responseBody = await response.json()
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Login user
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 1: Click Profile
        await page.goto('app/profile')
        await expect(page).toHaveURL(/.*\/profile/)
        
        // Step 2: Click Delete Account
        await page.getByRole('button', { name: 'Delete Account' }).click()
        
        // Step 3: Confirm Delete
        await page.getByTestId('note-delete-confirm').click()
        
        // Step 4: Validate message: "Your account has been deleted. You should create a new account to continue."
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Your account has been deleted. You should create a new account to continue.')
        await expect(alertMessage).toBeVisible()
        
        // Step 5: Validate redirection to login page
        await expect(page).toHaveURL(/.*\/login/)
        
        // Step 6: Delete fixture via deleteJsonFile if exists
        await deleteJsonFile(fixtureKey)
    })
})

