import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../repositories/MockAuthRepository'
import { LoginPage } from './LoginPage'

const originalUserAgent = navigator.userAgent
afterEach(() => Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent }))

describe('LoginPage', () => {
  it('warns but does not block Google sign-in in an in-app browser', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 Instagram 300.0' })
    render(<AuthProvider repository={new MockAuthRepository()}><MemoryRouter><LoginPage /></MemoryRouter></AuthProvider>)
    expect(await screen.findByText('此瀏覽器可能無法完成 Google 登入，請使用 Safari 或 Chrome 開啟。')).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: '使用 Google 帳號登入' })).toBeEnabled()
  })

  it('saves the requested internal route before starting Google sign-in', async () => {
    sessionStorage.clear()
    render(<AuthProvider repository={new MockAuthRepository({ loading: true })}><MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/restaurants/import' } }]}><LoginPage /></MemoryRouter></AuthProvider>)
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 帳號登入' }))
    await waitFor(() => expect(sessionStorage.getItem('food-map.intended-route')).toBe('/restaurants/import'))
  })
})