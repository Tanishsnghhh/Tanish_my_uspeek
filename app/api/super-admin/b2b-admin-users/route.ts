import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';
const BUSINESS_UNITS_COLLECTION = 'businessunits';

// GET - Fetch B2B admin users (only CORPORATE_ADMIN role) for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const emailFilter = searchParams.get('email') || '';
    const phoneFilter = searchParams.get('phone') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter query - only CORPORATE_ADMIN role users
    const filter: any = {
      role: 'CORPORATE_ADMIN',
      status: 'ACTIVE'
    };

    // Add email filter if provided
    if (emailFilter) {
      filter.email = { $regex: emailFilter, $options: 'i' };
    }

    // Add phone filter if provided (assuming phone field exists)
    if (phoneFilter) {
      filter.phone = { $regex: phoneFilter, $options: 'i' };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch B2B admin users with pagination
    const b2bAdminUsers = await usersCollection
      .find(filter)
      .project({
        _id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        status: 1,
        account_id: 1,
        created_at: 1,
        updated_at: 1,
        lastLoginAt: 1,
        phone: 1,
        planExpiryDate: 1,
        passwordChanged: 1,
        tempPassword: 1
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await usersCollection.countDocuments(filter);

    // Populate account information for each user
    const populatedUsers = await Promise.all(
      b2bAdminUsers.map(async (user) => {
        let accountInfo = null;
        
        if (user.account_id) {
          // Try to get account info from businessunits collection
          accountInfo = await businessUnitsCollection.findOne(
            { _id: user.account_id },
            { projection: { businessName: 1, businessCode: 1, region: 1 } }
          );
        }

        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone || 'N/A',
          role: user.role,
          status: user.status,
          accountId: user.account_id?.toString() || null,
          accountName: accountInfo?.businessName || null,
          companyName: accountInfo?.businessName || null,
          businessCode: accountInfo?.businessCode || null,
          region: accountInfo?.region || null,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLoginAt: user.lastLoginAt,
          planExpiryDate: user.planExpiryDate || null,
          isActive: user.status === 'ACTIVE',
          passwordChanged: user.passwordChanged || false,
          tempPassword: user.passwordChanged === false ? user.tempPassword : null
        };
      })
    );

    console.log(`Fetched ${populatedUsers.length} B2B admin users out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: {
        users: populatedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching B2B admin users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch B2B admin users',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// POST - Create a new B2B admin user
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);

    const body = await request.json();
    const { firstName, lastName, email, phone, accountId, planExpiryDate, city, state, country, countryCode, phoneCode, location } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !city || !state || !country || !countryCode || !phoneCode || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone, city, state, country, countryCode, phoneCode, location' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format (should be 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate temporary password
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let tempPassword = '';
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return tempPassword;
    };

    const tempPassword = generateTempPassword();
    
    // Hash the temporary password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create CorporateAccount first
    const corporateAccount = {
      email: email.toLowerCase(),
      password: tempPassword, // Store plain text for display, will be hashed by model
      role: 'ADMIN',
      status: 'ACTIVE',
      companyName: `${firstName} ${lastName} Company`,
      subscriptionPlan: 'basic',
      maxEmployees: 100,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const corporateAccountResult = await db.collection('corporateaccounts').insertOne(corporateAccount);
    const corporateAccountId = corporateAccountResult.insertedId;

    // Create new B2B admin user
    const newUser = {
      email: email.toLowerCase(),
      password_hash: hashedPassword, // Use the hashed temp password as the actual password
      firstName,
      lastName,
      first_name: firstName,
      last_name: lastName,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      role: 'CORPORATE_ADMIN',
      status: 'ACTIVE',
      account_id: corporateAccountId, // Use the created corporate account ID
      phone: phone || null,
      planExpiryDate: planExpiryDate || null,
      created_at: new Date(),
      updated_at: new Date(),
      lastLoginAt: null,
      passwordChanged: false,
      tempPassword: tempPassword
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newUser,
        tempPassword: tempPassword // Include temp password in response
      }
    });

  } catch (error: any) {
    console.error('Error creating B2B admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create B2B admin user',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
