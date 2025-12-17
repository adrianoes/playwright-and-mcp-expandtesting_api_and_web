import { test, expect } from '@playwright/test'

test.describe('Health Web Tests', () => {

    test('TC390 - Check the health of the app website via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Step 1: Navigate to home page
        await page.goto('app')
        
        // Step 2: Validate URL - Checkpoint after navigation
        await expect(page).toHaveURL(/.*\/app\/$|.*\/app$/)
        
        // Step 3: Validate page title - Checkpoint for page load
        await expect(page).toHaveTitle('Notes React Application for Automation Testing Practice')
        
        // Step 4: Validate welcome heading is visible - Checkpoint for main content
        const welcomeHeading = page.getByRole('heading', { name: 'Welcome to Notes App' })
        await expect(welcomeHeading).toBeVisible()
        
        // Step 5: Validate subtitle heading is visible - Checkpoint for content structure
        const subtitleHeading = page.getByRole('heading', { name: 'A Better Way To Track Your Tasks' })
        await expect(subtitleHeading).toBeVisible()
        
        // Step 6: Validate navigation links are present and enabled - Checkpoint for navigation
        const loginLink = page.getByRole('link', { name: 'Login' })
        await expect(loginLink).toBeVisible()
        await expect(loginLink).toBeEnabled()
        
        const createAccountLink = page.getByRole('link', { name: 'Create an account' })
        await expect(createAccountLink).toBeVisible()
        await expect(createAccountLink).toBeEnabled()
        
        // Step 7: Validate additional links are present - Checkpoint for page completeness
        const forgotPasswordLink = page.getByRole('link', { name: 'Forgot your password?' })
        await expect(forgotPasswordLink).toBeVisible()
        
        // Step 8: Validate page structure - Checkpoint for page structure
        const mainContent = page.getByRole('main')
        await expect(mainContent).toBeVisible()
        
        // Step 9: Validate footer is present - Checkpoint for page completeness
        const footer = page.getByRole('contentinfo')
        await expect(footer).toBeVisible()
        
        // Step 10: Validate footer content - Checkpoint for footer content
        const footerHeading = page.getByRole('heading', { name: 'Practice Test Automation WebSite for Web UI and Rest API' })
        await expect(footerHeading).toBeVisible()
    })

})

