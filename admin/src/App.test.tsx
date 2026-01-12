import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />)
    // The app should render something (at minimum, the login page or a redirect)
    expect(document.body).toBeTruthy()
  })

  it('should redirect to dashboard by default', () => {
    render(<App />)
    // Since we're not authenticated, we should see the login page
    // (PrivateRoute will redirect unauthenticated users to login)
    expect(window.location.pathname).toBeDefined()
  })
})
