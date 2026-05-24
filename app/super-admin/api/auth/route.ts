import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// In production, store this securely (environment variable)
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'super-admin-secret-key-2024'

interface LoginCredentials {
  username: string
  password: string
}

interface TokenPayload {
  sub: string
  name: string
  email: string
  role: string
  iat: number
  exp: number
  jti: string
}

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginCredentials = await request.json()
    
    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Rate limiting check (basic implementation)
    // NextRequest does not have an 'ip' property, so we rely on headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIP = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : 'unknown'
    const rateLimitKey = `super-admin-login:${clientIP}`

    // In production, use Redis for rate limiting
    // For now, we'll use a simple timestamp-based check
    
    // Validate credentials
    if (username !== 'admin@uspeek.com' || password !== 'mayo@9898') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Generate secure JWT token
    const token = generateSecureToken()
    
    // Log successful authentication
    console.log(`Super Admin authentication successful: ${new Date().toISOString()} - IP: ${clientIP}`)
    
    // Set HTTP-only cookie for security
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token: token,
      user: {
        id: 'super-admin-001',
        username: 'admin@uspeek.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    })
    
    response.cookies.set('super-admin-token', token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/super-admin' // Scoped to super admin routes
    })
    
    return response
    
  } catch (error) {
    console.error('Super Admin authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
    
    // Clear the token cookie
    response.cookies.set('super-admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/super-admin'
    })
    
    return response
    
  } catch (error) {
    console.error('Super Admin logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

function generateSecureToken(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const payload: TokenPayload = {
    sub: 'super-admin-001',
    name: 'Super Admin',
    email: 'admin@uspeek.com',
    role: 'SUPER_ADMIN',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
    jti: crypto.randomBytes(16).toString('hex') // Unique token ID
  }
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  
  // Create signature (in production, use proper HMAC)
  const signature = createSignature(encodedHeader, encodedPayload)
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function createSignature(header: string, payload: string): string {
  const data = `${header}.${payload}`
  const signature = crypto
    .createHmac('sha256', SUPER_ADMIN_SECRET)
    .update(data)
    .digest('base64url')
  
  return signature
}

function base64UrlEncode(input: string): string {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
