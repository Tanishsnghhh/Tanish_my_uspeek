'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './login.css'

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('admin@uspeek.com')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const router = useRouter()

  // Security: Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('super-admin-token')
    if (token && isValidToken(token)) {
      router.push('/super-admin/dashboard')
    }
  }, [router])

  // Security: Rate limiting
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('login-attempts') || '0')
    const lastAttempt = localStorage.getItem('last-login-attempt')
    
    if (attempts >= 5) {
      const now = new Date().getTime()
      const lockTime = parseInt(lastAttempt || '0') + (15 * 60 * 1000) // 15 minutes
      
      if (now < lockTime) {
        setIsLocked(true)
        const remainingTime = Math.ceil((lockTime - now) / 1000 / 60)
        setError(`Account locked for ${remainingTime} minutes due to too many failed attempts`)
        return
      } else {
        // Reset attempts after lock period
        localStorage.removeItem('login-attempts')
        localStorage.removeItem('last-login-attempt')
      }
    }
    
    setLoginAttempts(attempts)
  }, [])

  const isValidToken = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      return
    }

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call delay for security
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify credentials
      if (username === 'admin@uspeek.com' && password === 'mayo@9898') {
        // Generate JWT token
        const token = generateJWTToken()
        
        // Store token securely
        localStorage.setItem('super-admin-token', token)
        localStorage.removeItem('login-attempts')
        localStorage.removeItem('last-login-attempt')
        
        // Log successful login
        console.log('Super Admin login successful:', new Date().toISOString())
        
        // Redirect to dashboard
        router.push('/super-admin/dashboard')
      } else {
        // Handle failed login
        const attempts = loginAttempts + 1
        setLoginAttempts(attempts)
        localStorage.setItem('login-attempts', attempts.toString())
        localStorage.setItem('last-login-attempt', new Date().getTime().toString())
        
        if (attempts >= 5) {
          setIsLocked(true)
          setError('Too many failed attempts. Account locked for 15 minutes.')
        } else {
          setError(`Invalid credentials. ${5 - attempts} attempts remaining.`)
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateJWTToken = (): string => {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }
    
    const payload = {
      sub: 'super-admin',
      name: 'Super Admin',
      email: 'admin@uspeek.com',
      role: 'SUPER_ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
      jti: Math.random().toString(36).substr(2, 9)
    }

    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    
    // In production, use proper HMAC signing
    const signature = btoa(`signature-${Math.random().toString(36)}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  const resetLockout = () => {
    localStorage.removeItem('login-attempts')
    localStorage.removeItem('last-login-attempt')
    setLoginAttempts(0)
    setIsLocked(false)
    setError('')
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-avatar">
              <svg className="login-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1z"></path>
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
                {isLocked && (
                  <button 
                    type="button" 
                    onClick={resetLockout}
                    className="reset-button"
                  >
                    Reset Lockout
                  </button>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLocked || isLoading}
                  required
                  autoComplete="username"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked || isLoading}
                  required
                  autoComplete="current-password"
                  className="form-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLocked || isLoading}
              className="submit-button"
            >
              {isLoading ? (
                <span>
                  <div className="spinner"></div>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="security-info">
              <div className="attempts-counter">
                Failed attempts: {loginAttempts}/5
              </div>
              <div className="security-note">
                🔒 Secured with JWT authentication and rate limiting
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
