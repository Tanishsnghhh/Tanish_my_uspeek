import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';
const B2C_CUSTOMERS_COLLECTION = 'b2ccustomers';

// Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET - Fetch B2C customers for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const b2cCustomersCollection = db.collection(B2C_CUSTOMERS_COLLECTION);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const emailFilter = searchParams.get('email') || '';
    const phoneFilter = searchParams.get('phone') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter query
    const filter: any = {};
    if (emailFilter) {
      filter.email = { $regex: emailFilter, $options: 'i' };
    }
    if (phoneFilter) {
      filter.phone = { $regex: phoneFilter, $options: 'i' };
    }

    // Get total count
    const totalCount = await b2cCustomersCollection.countDocuments(filter);

    // Get paginated results
    const skip = (page - 1) * limit;
    const customers = await b2cCustomersCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform the data
    const transformedCustomers = customers.map(customer => ({
      id: customer._id.toString(),
      _id: customer._id.toString(),
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      userName: customer.userName,
      phone: customer.phone,
      address: customer.address || null,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      countryCode: customer.countryCode,
      phoneCode: customer.phoneCode,
      location: customer.location,
      branch: customer.branch || null,
      department: customer.department || null,
      role: customer.role,
      employeeCode: customer.employeeCode || null,
      companyName: customer.companyName || null,
      gst: customer.gst || null,
      gstNumber: customer.gstNumber || null,
      website: customer.website || null,
      designation: customer.designation || null,
      description: customer.description || null,
      planId: customer.planId || null,
      registrationDate: customer.registrationDate,
      planStartDate: customer.planStartDate || null,
      planExpiryDate: customer.planExpiryDate || null,
      videoLimit: customer.videoLimit || 0,
      manager: customer.manager || null,
      alternateEmail: customer.alternateEmail || null,
      isAccountActive: customer.isAccountActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      lastLoginAt: customer.lastLoginAt || null,
      passwordChanged: customer.passwordChanged || false,
      tempPassword: customer.tempPassword || null
    }));

    return NextResponse.json({
      success: true,
      data: {
        customers: transformedCustomers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount: totalCount,
          limit: limit,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching B2C customers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch B2C customers',
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

// POST - Create a new B2C customer
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);
    const b2cCustomersCollection = db.collection(B2C_CUSTOMERS_COLLECTION);

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      userName,
      email, 
      phone, 
      address,
      city, 
      state, 
      country, 
      countryCode, 
      phoneCode,
      location,
      branch,
      department,
      employeeCode,
      companyName,
      gst,
      gstNumber,
      website,
      designation,
      description,
      planId,
      planStartDate,
      planExpiryDate,
      videoLimit,
      manager,
      alternateEmail
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !userName || !email || !phone || !city || !state || !country || !countryCode || !phoneCode || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, userName, email, phone, city, state, country, countryCode, phoneCode, location' },
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

    // Check if email already exists
    const existingCustomer = await b2cCustomersCollection.findOne({ email: email.toLowerCase() });
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (existingCustomer || existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Check if userName already exists
    const existingUserName = await b2cCustomersCollection.findOne({ userName: userName });
    if (existingUserName) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    
    // Hash the temporary password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create B2C customer
    const b2cCustomer = {
      email: email.toLowerCase(),
      password: tempPassword, // Store plain text for display, will be hashed by model
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: userName.trim(),
      phone: phone.trim(),
      address: address?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      branch: branch?.trim() || null,
      department: department?.trim() || null,
      role: 'B2C_CUSTOMER',
      employeeCode: employeeCode?.trim() || null,
      companyName: companyName?.trim() || null,
      gst: gst?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
      website: website?.trim() || null,
      designation: designation?.trim() || null,
      description: description?.trim() || null,
      planId: planId?.trim() || null,
      registrationDate: new Date(),
      planStartDate: planStartDate ? new Date(planStartDate) : null,
      planExpiryDate: planExpiryDate ? new Date(planExpiryDate) : null,
      videoLimit: videoLimit || 0,
      manager: manager?.trim() || null,
      alternateEmail: alternateEmail?.toLowerCase().trim() || null,
      isAccountActive: true,
      created_at: new Date(),
      updated_at: new Date(),
      lastLoginAt: null,
      passwordChanged: false,
      tempPassword: tempPassword
    };

    const b2cCustomerResult = await b2cCustomersCollection.insertOne(b2cCustomer);
    const b2cCustomerId = b2cCustomerResult.insertedId;

    // Create User record for authentication
    const newUser = {
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      role: 'B2C_CUSTOMER',
      status: 'ACTIVE',
      account_id: b2cCustomerId, // Reference the B2C customer record
      phone: phone.trim(),
      planExpiryDate: planExpiryDate ? new Date(planExpiryDate) : null,
      created_at: new Date(),
      updated_at: new Date(),
      lastLoginAt: null,
      passwordChanged: false,
      tempPassword: tempPassword
    };

    const userResult = await usersCollection.insertOne(newUser);

    return NextResponse.json({
      success: true,
      data: {
        id: userResult.insertedId.toString(),
        ...newUser,
        tempPassword: tempPassword // Include temp password in response
      }
    });

  } catch (error: any) {
    console.error('Error creating B2C customer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create B2C customer',
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

// PUT - Update a B2C customer
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);
    const b2cCustomersCollection = db.collection(B2C_CUSTOMERS_COLLECTION);

    const body = await request.json();
    const { 
      id,
      firstName, 
      lastName, 
      userName,
      email, 
      phone, 
      address,
      city, 
      state, 
      country, 
      countryCode, 
      phoneCode,
      location,
      branch,
      department,
      employeeCode,
      companyName,
      gst,
      gstNumber,
      website,
      designation,
      description,
      planId,
      planStartDate,
      planExpiryDate,
      videoLimit,
      manager,
      alternateEmail,
      isAccountActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !userName || !email || !phone || !city || !state || !country || !countryCode || !phoneCode || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, userName, email, phone, city, state, country, countryCode, phoneCode, location' },
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

    // Check if email already exists for other users
    const existingCustomer = await b2cCustomersCollection.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: new ObjectId(id) }
    });
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase(),
      account_id: { $ne: new ObjectId(id) }
    });
    
    if (existingCustomer || existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Check if userName already exists for other users
    const existingUserName = await b2cCustomersCollection.findOne({ 
      userName: userName,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingUserName) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Update B2C customer
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: userName.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      address: address?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      branch: branch?.trim() || null,
      department: department?.trim() || null,
      employeeCode: employeeCode?.trim() || null,
      companyName: companyName?.trim() || null,
      gst: gst?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
      website: website?.trim() || null,
      designation: designation?.trim() || null,
      description: description?.trim() || null,
      planId: planId?.trim() || null,
      planStartDate: planStartDate ? new Date(planStartDate) : null,
      planExpiryDate: planExpiryDate ? new Date(planExpiryDate) : null,
      videoLimit: videoLimit || 0,
      manager: manager?.trim() || null,
      alternateEmail: alternateEmail?.toLowerCase().trim() || null,
      isAccountActive: isAccountActive !== undefined ? isAccountActive : true,
      updated_at: new Date()
    };

    const b2cUpdateResult = await b2cCustomersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (b2cUpdateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'B2C customer not found' },
        { status: 404 }
      );
    }

    // Update User record
    const userUpdateData = {
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      phoneCode: phoneCode.trim(),
      location: location.trim(),
      phone: phone.trim(),
      planExpiryDate: planExpiryDate ? new Date(planExpiryDate) : null,
      status: isAccountActive !== undefined ? (isAccountActive ? 'ACTIVE' : 'DEACTIVATED') : 'ACTIVE',
      updated_at: new Date()
    };

    await usersCollection.updateOne(
      { account_id: new ObjectId(id) },
      { $set: userUpdateData }
    );

    return NextResponse.json({
      success: true,
      message: 'B2C customer updated successfully',
      data: {
        id: id,
        ...updateData
      }
    });

  } catch (error: any) {
    console.error('Error updating B2C customer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update B2C customer',
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
