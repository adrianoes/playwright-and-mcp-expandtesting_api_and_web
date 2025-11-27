import { APIRequestContext, expect, Page } from '@playwright/test'
import { faker } from '@faker-js/faker'
import fs from 'fs'

export async function getFullFilledResponseCU(page: Page) {
    return page.waitForResponse('/notes/api/users/register')
}

export async function getFullFilledResponseLogIn(page: Page) {
    return page.waitForResponse('/notes/api/users/login')
}

export async function logInUserViaWeb(page: Page, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user = {
        user_email: body.user_email,
        user_id: body.user_id,
        user_name: body.user_name,
        user_password: body.user_password
    }
    await page.goto('app/login')
    await page.getByTestId('login-email').fill(user.user_email)
    await page.getByTestId('login-password').fill(user.user_password)
    const responsePromise = getFullFilledResponseLogIn(page)
    await page.getByRole('button', { name: 'Login' }).click()
    const response = await responsePromise
    const responseBody = await response.json()
    await page.goto('app/profile')
    const userEmail = page.locator('[data-testid="user-email"]')
    await expect(userEmail).toHaveValue(user.user_email)        
    await expect(userEmail).toBeVisible()
    const userId = page.locator('[data-testid="user-id"]')
    await expect(userId).toHaveValue(user.user_id)        
    await expect(userId).toBeVisible()
    const userName = page.locator('[data-testid="user-name"]')
    await expect(userName).toHaveValue(user.user_name)        
    await expect(userName).toBeVisible()    
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
        user_email: user.user_email,
        user_id: user.user_id,
        user_name: user.user_name,
        user_password: user.user_password,
        user_token: responseBody.data.token
    }), "utf8");
}

export async function deleteJsonFile(randomNumber: string) {
    try {fs.unlinkSync(`tests/fixtures/testdata-${randomNumber}.json`)} catch(err) {throw err}
}

export async function deleteUserViaWeb(page: Page) {
    await page.goto('app/profile')
    await page.getByRole('button', { name: 'Delete Account' }).click()     
    await page.getByTestId('note-delete-confirm').click() 
    const alertMessage = page.getByTestId('alert-message')
    await expect(alertMessage).toContainText('Your account has been deleted. You should create a new account to continue.')        
    await expect(alertMessage).toBeVisible()
}

// API Commands
export async function logInUserViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user = {
        user_email: body.user_email,
        user_id: body.user_id,
        user_name: body.user_name,
        user_password: body.user_password
    }
    const responseLU = await request.post(`api/users/login`, {
        data: {
            email: user.user_email,
            password: user.user_password
        }
    });
    const responseBodyLU = await responseLU.json()
    expect(responseBodyLU.data.email).toEqual(user.user_email)
    expect(responseBodyLU.data.id).toEqual(user.user_id)
    expect(responseBodyLU.data.name).toEqual(user.user_name) 
    expect(responseBodyLU.message).toEqual('Login successful')
    expect(responseLU.status()).toEqual(200)    
    console.log(responseBodyLU.message)   
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
        user_email: user.user_email,
        user_id: user.user_id,
        user_name: user.user_name,
        user_password: user.user_password,
        user_token: responseBodyLU.data.token
    }), "utf8");
}

export async function deleteUserViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user_token = body.user_token
    const responseDU = await request.delete(`api/users/delete-account`,{
        headers: { 'X-Auth-Token': user_token }
    })
    const responseBodyDU = await responseDU.json()
    expect(responseBodyDU.message).toEqual('Account successfully deleted')
    expect(responseDU.status()).toEqual(200)
    console.log(responseBodyDU.message)
}

