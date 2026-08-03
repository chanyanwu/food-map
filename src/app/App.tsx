import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { AppRouter } from './router/AppRouter'

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </AuthProvider>
  )
}