import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the mobile-first welcome screen', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '記下每一次好好吃飯。' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /前往登入/ })).toHaveAttribute('href', '#/login')
  })
})