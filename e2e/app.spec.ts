import { expect, test } from '@playwright/test'

test('navigates to the login placeholder through the hash router', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /前往登入/ }).click()
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByRole('heading', { name: '準備好收集下一間店了嗎？' })).toBeVisible()
})