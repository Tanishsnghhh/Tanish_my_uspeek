import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if accessing super admin routes
  if (pathname.startsWith('/super-admin')) {
    // Skip middleware for login page
    if (pathname === '/super-admin/login') {
      return NextResponse.next()
    }
    
    // Check for super admin token
    const token = request.cookies.get('super-admin-token')?.value
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/super-admin/login', request.url))
    }
    
    // Basic token validation
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // Check token expiration
      if (payload.exp * 1000 < Date.now()) {
        return NextResponse.redirect(new URL('/super-admin/login', request.url))
      }
      
      // Check role
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/login', request.url))
      }
      
    } catch (error) {
      // Invalid token format
      return NextResponse.redirect(new URL('/super-admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/super-admin/:path*',
  ]
}
