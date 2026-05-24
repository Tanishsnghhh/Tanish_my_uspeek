import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CorporateAccount from '@/lib/models/CorporateAccount';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const {
      companyName,
      subscriptionPlan,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      city,
      state,
      country,
      countryCode,
      phoneCode,
      location,
      customAttributes
    } = await request.json();

    // Validate required fields
    if (!companyName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName || !city || !state || !country || !countryCode || !phoneCode || !location) {
      return NextResponse.json(
        { error: 'All required fields must be provided including city, state, country, country code, phone code, and location' },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await CorporateAccount!.findOne({ companyName });
    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company name already exists' },
        { status: 409 }
      );
    }

    // Check if admin email already exists in both User and CorporateAccount collections
    const existingUser = await User!.findOne({ email: adminEmail.toLowerCase() });
    const existingAdmin = await CorporateAccount!.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingUser || existingAdmin) {
      return NextResponse.json(
        { error: 'Admin email already exists' },
        { status: 409 }
      );
    }

    // Create admin user with embedded corporate account information
    const adminUser = await CorporateAccount!.create({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'ADMIN',
      companyName,
      subscriptionPlan: subscriptionPlan || 'basic',
      customAttributes: customAttributes || {
        attribute1: { name: 'Division', values: [] },
        attribute2: { name: 'Function', values: [] },
        attribute3: { name: 'Role', values: [] }
      },
      maxEmployees: subscriptionPlan === 'enterprise' ? 50000 : subscriptionPlan === 'professional' ? 1000 : 100,
      firstName: adminFirstName,
      lastName: adminLastName,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim()
    });

    // Create User record for authentication with CORPORATE_ADMIN role
    const newUser = await User!.create({
      email: adminEmail.toLowerCase(),
      password_hash: adminPassword, // This will be hashed by the User model pre-save hook
      role: 'CORPORATE_ADMIN',
      status: 'ACTIVE',
      account_id: adminUser!._id, // Reference the Admin record as corporate account
      firstName: adminFirstName,
      lastName: adminLastName,
      first_name: adminFirstName,
      last_name: adminLastName,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim()
    });

    // Log the account creation
    await AuditLog.create({
      performed_by_user_id: adminUser!._id,
      action_type: 'CREATE_CORPORATE_ACCOUNT',
      details: `Corporate account created for ${companyName} with admin ${adminEmail}`,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Corporate account created successfully',
      corporateAccount: {
        id: adminUser!._id.toString(),
        companyName: adminUser!.companyName,
        subscriptionPlan: adminUser!.subscriptionPlan
      },
      adminUser: {
        id: adminUser!._id.toString(),
        email: adminUser!.email,
        firstName: adminUser!.firstName,
        lastName: adminUser!.lastName,
        role: adminUser!.role
      },
      userRecord: {
        id: newUser!._id.toString(),
        email: newUser!.email,
        role: newUser!.role,
        account_id: newUser!.account_id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
