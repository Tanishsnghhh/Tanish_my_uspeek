import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'Tr4nscend@2024!';

export interface AdminAuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  corporateAccountId: string | null;
  userId: string | null;
  error?: string;
}

/**
 * Check if the user is an admin with proper permissions for the account
 * Any CORPORATE_ADMIN within the same account can manage assignments and work reports
 */
export async function checkAdminPermissions(request: NextRequest, requiredAccountId?: string): Promise<AdminAuthResult> {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        corporateAccountId: null,
        userId: null,
        error: 'Authorization token required'
      };
    }

    // Decode and verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        corporateAccountId: null,
        userId: null,
        error: 'Invalid token'
      };
    }
    
    if (!decoded || !decoded.userId || !decoded.role) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        corporateAccountId: null,
        userId: null,
        error: 'Invalid token'
      };
    }

    // Check if user has admin role
    const isAdmin = decoded.role === 'CORPORATE_ADMIN' || decoded.role === 'ADMIN';
    
    if (!isAdmin) {
      return {
        isAuthenticated: true,
        isAdmin: false,
        corporateAccountId: decoded.corporateAccountId || null,
        userId: decoded.userId,
        error: 'Admin privileges required'
      };
    }

    // Verify account access if required
    if (requiredAccountId && decoded.corporateAccountId !== requiredAccountId) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        corporateAccountId: decoded.corporateAccountId || null,
        userId: decoded.userId,
        error: 'Access denied: Cannot manage assignments for different account'
      };
    }

    return {
      isAuthenticated: true,
      isAdmin: true,
      corporateAccountId: decoded.corporateAccountId || null,
      userId: decoded.userId
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      corporateAccountId: null,
      userId: null,
      error: 'Token verification failed'
    };
  }
}

/**
 * Check if user can perform the requested action on assignments/work reports
 * Rules:
 * - Any CORPORATE_ADMIN in the account can create, edit, delete assignments and work reports
 * - Employees can only create and edit their own work reports
 * - Employees cannot delete work reports (only admins can)
 */
export function canPerformAction(
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'assignment' | 'work-report',
  userRole: string,
  isOwner: boolean = false
): boolean {
  const isAdmin = userRole === 'CORPORATE_ADMIN' || userRole === 'ADMIN';
  
  // Admins can do everything
  if (isAdmin) {
    return true;
  }
  
  // For non-admin users (employees)
  if (resource === 'assignment') {
    // Only admins can manage assignments
    return false;
  }
  
  if (resource === 'work-report') {
    switch (action) {
      case 'create':
        return true; // Employees can create their own work reports
      case 'read':
        return true; // Employees can view work reports (filtered by permissions in query)
      case 'update':
        return isOwner; // Employees can only edit their own work reports
      case 'delete':
        return false; // Only admins can delete work reports
    }
  }
  
  return false;
}
