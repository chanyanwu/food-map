import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../providers/AuthProvider'
import { MockAuthRepository } from '../../features/authentication/repositories/MockAuthRepository'
import { AppRouter } from './AppRouter'

vi.mock('../../core/firebase/firebaseClient', () => ({
  createFirebaseServices: vi.fn(() => ({ auth: {}, firestore: {}, storage: {} })),
  shouldUseFirebaseEmulator: vi.fn(() => false)
}))

vi.mock('../../features/restaurants/repositories/FirebaseRestaurantRepository', () => ({
  FirebaseRestaurantRepository: class {
    getRestaurantsByOwner() {
      return Promise.resolve([])
    }
  }
}))

const authenticatedUser = { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null }

function renderRouter(repository: MockAuthRepository, initialEntry: string | { pathname: string; state?: unknown } = '/') {
  return render(<AuthProvider repository={repository}><MemoryRouter initialEntries={[initialEntry]}><AppRouter /></MemoryRouter></AuthProvider>)
}

describe('AppRouter authentication', () => {
  it('shows a loading screen while auth state is unresolved', () => {
    renderRouter(new MockAuthRepository({ loading: true }))
    expect(screen.getByRole('status')).toHaveTextContent('私人內容尚未載入')
  })

  it('redirects unauthenticated private navigation to login', async () => {
    renderRouter(new MockAuthRepository())
    expect(await screen.findByRole('heading', { name: '準備好收集下一間店了嗎？' })).toBeInTheDocument()
  })

  it('shows a friendly failed sign-in message and disables while signing in', async () => {
    renderRouter(new MockAuthRepository({ signInError: Object.assign(new Error('blocked'), { code: 'auth/popup-closed-by-user' }) }), '/login')
    const button = await screen.findByRole('button', { name: '使用 Google 帳號登入' })
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(await screen.findByRole('alert')).toHaveTextContent('登入視窗已關閉')
  })

  it('redirects authenticated users away from login and supports logout', async () => {
    const repository = new MockAuthRepository({ initialUser: authenticatedUser })
    renderRouter(repository, '/login')
    expect(await screen.findByRole('heading', { name: '歡迎回來，Alice。' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '登出 Food Map' }))
    expect(await screen.findByRole('heading', { name: '準備好收集下一間店了嗎？' })).toBeInTheDocument()
  })

  it('returns to the requested route after successful sign-in', async () => {
    const repository = new MockAuthRepository()
    renderRouter(repository, { pathname: '/login', state: { from: '/' } })
    fireEvent.click(await screen.findByRole('button', { name: '使用 Google 帳號登入' }))
    expect(await screen.findByRole('heading', { name: '歡迎回來，Mock User。' })).toBeInTheDocument()
  })
})