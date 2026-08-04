import { describe, expect, it } from 'vitest'
import { toFriendlyAuthError } from './authErrorMessage'

describe('toFriendlyAuthError', () => {
  it.each([
    ['auth/popup-blocked', '瀏覽器阻擋登入視窗，將改用頁面跳轉登入'],
    ['auth/unauthorized-domain', '目前網址尚未被授權使用 Google 登入'],
    ['auth/network-request-failed', '網路連線失敗，請確認連線後再試'],
    ['auth/operation-not-allowed', 'Google 登入尚未啟用']
  ])('maps %s to a safe Chinese message', (code, message) => {
    expect(toFriendlyAuthError({ code })).toBe(message)
  })
})