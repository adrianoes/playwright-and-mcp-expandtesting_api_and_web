import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { logInUserViaApi, deleteUserViaApi, deleteJsonFile } from '../support/commands'
import fs from 'fs'

test.beforeAll(async () => {
    try {
        fs.unlinkSync(`tests/fixtures/testdata.json`)
    } catch(err) {
        // File doesn't exist, which is fine
    }
    // Keep an empty file to help npm recognize the fixtures directory
    fs.writeFileSync(`tests/fixtures/testdata.json`,' ', "utf8"); 
});

test.describe('Users API Tests', () => {

    test('Create a New User via API @API @BASIC @FULL', async ({ request }) => {
        // Generate unique fixture identifier
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Generate dynamic test data using Faker
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        // Step 1: Send POST /api/users/register with valid payload
        const responseCU = await request.post(`api/users/register`, {
            data: {
                name: user.user_name,
                email: user.user_email,
                password: user.user_password
            }
        });

        // Step 2: Read response body
        const responseBodyCU = await responseCU.json()
        
        // Step 1 validation: Response status = 201
        expect(responseCU.status()).toEqual(201)
        
        // Step 2 validation: Contains data.id, data.email, data.name
        expect(responseBodyCU.data).toBeDefined()
        expect(responseBodyCU.data.id).toBeDefined()
        expect(responseBodyCU.data.email).toBeDefined()
        expect(responseBodyCU.data.name).toBeDefined()
        
        // Validate that returned data matches submitted payload
        expect(responseBodyCU.data.email).toEqual(user.user_email)
        expect(responseBodyCU.data.name).toEqual(user.user_name)
        
        // Step 3: Validate success message
        expect(responseBodyCU.message).toEqual('User account created successfully')
        expect(responseBodyCU.success).toBe(true)
        expect(responseBodyCU.status).toEqual(201)
        
        console.log(responseBodyCU.message)
        
        // Step 4: Save fixture file to tests/fixtures/<id>.json
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBodyCU.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 5: Use custom command to log in the user
        await logInUserViaApi(request, fixtureKey)
        
        // Step 6: Use custom command to delete the user
        await deleteUserViaApi(request, fixtureKey)
        
        // Step 7: Use custom command to delete fixture file
        await deleteJsonFile(fixtureKey)
    })
})

