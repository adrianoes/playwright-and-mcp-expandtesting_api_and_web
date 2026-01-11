import { test, expect } from '@playwright/test'

test.describe('Health API Tests', () => {
  test('TC001 - Check the health of the API Notes service via API @API @BASIC @FULL', async ({ request }) => {
    const response = await request.get('api/health-check')
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Notes API is Runningy')
    expect(body.success).toBe(true)
  })
})

