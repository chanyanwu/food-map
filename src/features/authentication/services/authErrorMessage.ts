const messages: Record<string, string> = {
  'auth/popup-closed-by-user': '登入視窗已關閉，請再試一次。',
  'auth/popup-blocked': '瀏覽器封鎖登入視窗，將改用重新導向登入。',
  'auth/network-request-failed': '網路連線發生問題，請確認連線後再試。',
  'auth/unauthorized-domain': '此網站網域尚未獲得 Firebase 登入授權。',
  'auth/account-exists-with-different-credential': '此 Email 已使用不同的登入方式，請使用原本的方法登入。',
  'auth/operation-not-allowed': 'Google 登入尚未在 Firebase Console 啟用。'
}

export function toFriendlyAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return messages[error.code] ?? '登入時發生未預期錯誤，請稍後再試。'
  }
  return '登入時發生未預期錯誤，請稍後再試。'
}