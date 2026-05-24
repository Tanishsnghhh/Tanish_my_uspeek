import { SignJWT, jwtVerify } from 'jose';
import { IUser, ICorporateAccount } from './models';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  corporateAccountId?: string; // Make optional
  firstName: string;
  lastName: string;
  [key: string]: any; // Add index signature for jose compatibility
}

// Union type for both User and CorporateAccount models
type AuthUser = IUser | ICorporateAccount;

export async function generateToken(user: AuthUser): Promise<string> {
  // Extract the actual ObjectId from account_id whether it's populated or not
  let corporateAccountId: string | undefined;
  
  // Both User and Admin models use 'account_id' field
  const accountIdField = (user as any).account_id;
  
  if (accountIdField) {
    if (typeof accountIdField === 'object' && accountIdField._id) {
      // If populated, get the _id
      corporateAccountId = accountIdField._id.toString();
    } else {
      // If not populated, use the ID directly
      corporateAccountId = (accountIdField as mongoose.Types.ObjectId).toString();
    }
  } else {
    // Handle case where account_id is null/undefined
    console.warn(`Warning: User ${user.email} has no account_id field`);
    corporateAccountId = undefined;
  }

  // For admin users, we need to get the profile data from CorporateAccount
  let firstName = (user as any).firstName || 'N/A';
  let lastName = (user as any).lastName || 'N/A';

  const payload: JWTPayload = {
    userId: (user._id as mongoose.Types.ObjectId).toString(),
    email: user.email,
    role: user.role,
    corporateAccountId: corporateAccountId,
    firstName: firstName,
    lastName: lastName
  };

  const secret = new TextEncoder().encode(JWT_SECRET);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Convert the jose payload to our JWTPayload format
    const decodedPayload = payload as any;
    return {
      userId: decodedPayload.userId,
      email: decodedPayload.email,
      role: decodedPayload.role,
      corporateAccountId: decodedPayload.corporateAccountId,
      firstName: decodedPayload.firstName,
      lastName: decodedPayload.lastName
    };
  } catch (error) {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
