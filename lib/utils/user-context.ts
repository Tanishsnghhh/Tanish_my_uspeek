/**
 * 🔐 User Context Utility
 * Provides user identification and role context without using JWT tokens
 * Extracts user information from authentication state for API requests
 */

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  corporateAccountId?: string;
  companyName?: string;
  jobTitle?: string;
  department?: string;
  employeeId?: string;
}

export interface UserContextInfo {
  userId: string;
  userType: 'admin' | 'employee';
  displayName: string;
  email: string;
  corporateAccountId?: string;
}

/**
 * Extract user context from authenticated user data
 * Determines whether user is admin or employee based on role
 */
export function getUserContext(user: User | null): UserContextInfo | null {
  if (!user) {
    return null;
  }

  // Determine user type based on role
  const isAdmin = user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN';
  const userType: 'admin' | 'employee' = isAdmin ? 'admin' : 'employee';

  // Create display name
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.email?.split('@')[0] || 'Unknown User';

  return {
    userId: user.id,
    userType,
    displayName,
    email: user.email || '',
    corporateAccountId: user.corporateAccountId
  };
}

/**
 * Create headers for API requests with user context
 * This provides user identification without exposing sensitive data
 */
export function createUserHeaders(user: User | null): HeadersInit {
  const userContext = getUserContext(user);
  
  if (!userContext) {
    return {};
  }

  return {
    'x-user-id': userContext.userId,
    'x-user-type': userContext.userType,
    'x-user-name': userContext.displayName,
    'x-account-id': userContext.corporateAccountId || 'default'
  };
}

/**
 * Enhanced user ID that includes user type for better identification in database
 * Format: "admin:{userId}" or "employee:{userId}" 
 */
export function getEnhancedUserId(user: User | null): string {
  const userContext = getUserContext(user);
  
  if (!userContext) {
    return 'anonymous-user';
  }

  return `${userContext.userType}:${userContext.userId}`;
}

/**
 * Parse enhanced user ID back to components
 */
export function parseEnhancedUserId(enhancedUserId: string): { userType: 'admin' | 'employee' | 'anonymous'; userId: string } {
  if (enhancedUserId === 'anonymous-user' || enhancedUserId === 'current-user') {
    return { userType: 'anonymous', userId: enhancedUserId };
  }

  const [userType, userId] = enhancedUserId.split(':');
  
  if (!userType || !userId || !['admin', 'employee'].includes(userType)) {
    return { userType: 'anonymous', userId: enhancedUserId };
  }

  return { userType: userType as 'admin' | 'employee', userId };
}

/**
 * Get user display name from enhanced user ID
 * This can be used in reports and exports where we need to show readable names
 */
export function getUserDisplayFromId(enhancedUserId: string): string {
  const { userType, userId } = parseEnhancedUserId(enhancedUserId);
  
  if (userType === 'anonymous') {
    return 'Unknown User';
  }

  // For display purposes, we can show the type and a truncated ID
  const shortId = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;
  const typeLabel = userType === 'admin' ? 'Admin' : 'Employee';
  
  return `${typeLabel} (${shortId})`;
}
