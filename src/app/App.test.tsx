import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('./config/firebase', () => ({
  firebaseWebConfig: {},
  isFirebaseConfigured: () => false
}))

describe('App', () => {
  it('shows a configuration error instead of a blank page without Firebase configuration', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '目前無法確認登入狀態。' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Firebase 尚未設定')
  })
})