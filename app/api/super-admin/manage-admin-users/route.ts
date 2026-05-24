import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const SUPER_ADMIN_COLLECTION = 'superadmins';

// GET - Fetch super admin users
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const superAdminCollection = db.collection(SUPER_ADMIN_COLLECTION);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const emailFilter = searchParams.get('email') || '';
    const nameFilter = searchParams.get('name') || '';
    const userTypeFilter = searchParams.get('userType') || '';
    const statusFilter = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter query
    const filter: any = {};

    // Add email filter if provided
    if (emailFilter) {
      filter.emailId = { $regex: emailFilter, $options: 'i' };
    }

    // Add name filter if provided
    if (nameFilter) {
      filter.fullName = { $regex: nameFilter, $options: 'i' };
    }

    // Add user type filter if provided
    if (userTypeFilter) {
      filter.userType = userTypeFilter;
    }

    // Add status filter if provided
    if (statusFilter) {
      filter.status = statusFilter;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch super admin users with pagination
    const superAdminUsers = await superAdminCollection
      .find(filter)
      .project({
        _id: 1,
        admin_id: 1,
        fullName: 1,
        emailId: 1,
        userType: 1,
        openPass: 1,
        contactNo: 1,
        pictureLocation: 1,
        status: 1,
        administrator: 1,
        lastLoginAt: 1,
        created_at: 1,
        updated_at: 1
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await superAdminCollection.countDocuments(filter);

    // Format the response data
    const formattedUsers = superAdminUsers.map(user => ({
      id: user._id.toString(),
      userId: user.admin_id?.toString() || user._id.toString(),
      fullName: user.fullName,
      emailId: user.emailId,
      userType: user.userType,
      openPass: user.openPass, // This is the plain text password for display
      contactNo: user.contactNo || '',
      pictureLocation: user.pictureLocation || '',
      status: user.status === 'ACTIVE' ? '1' : '0',
      administrator: user.administrator,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    console.log(`Fetched ${formattedUsers.length} super admin users out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
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
    console.error('Error fetching super admin users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch super admin users',
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

// POST - Create a new super admin user
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const superAdminCollection = db.collection(SUPER_ADMIN_COLLECTION);

    const body = await request.json();
    const { fullName, emailId, userType, openPass, contactNo, pictureLocation, administrator } = body;

    // Validate required fields
    if (!fullName || !emailId || !userType || !openPass) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, emailId, userType, openPass' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if super admin already exists
    const existingAdmin = await superAdminCollection.findOne({ emailId: emailId.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Super admin with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(openPass, salt);

    // Create new super admin
    const newSuperAdmin = {
      fullName: fullName.trim(),
      emailId: emailId.toLowerCase().trim(),
      userType: userType,
      openPass: openPass, // Store plain text for display
      password_hash: password_hash, // Store hashed for authentication
      contactNo: contactNo || '',
      pictureLocation: pictureLocation || '',
      status: 'ACTIVE',
      administrator: administrator !== undefined ? administrator : true,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await superAdminCollection.insertOne(newSuperAdmin);

    console.log(`Created new super admin: ${emailId}`);

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        id: result.insertedId.toString(),
        fullName: newSuperAdmin.fullName,
        emailId: newSuperAdmin.emailId,
        userType: newSuperAdmin.userType,
        status: newSuperAdmin.status
      }
    });

  } catch (error: any) {
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create super admin',
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

// PUT - Update a super admin user
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const superAdminCollection = db.collection(SUPER_ADMIN_COLLECTION);

    const body = await request.json();
    const { id, fullName, emailId, userType, openPass, contactNo, pictureLocation, status, administrator } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if super admin exists
    const existingAdmin = await superAdminCollection.findOne({ _id: new ObjectId(id) });
    if (!existingAdmin) {
      return NextResponse.json(
        { error: 'Super admin not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date()
    };

    if (fullName) updateData.fullName = fullName.trim();
    if (emailId) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      updateData.emailId = emailId.toLowerCase().trim();
    }
    if (userType) updateData.userType = userType;
    if (openPass) {
      updateData.openPass = openPass;
      // Hash the new password
      const salt = await bcrypt.genSalt(12);
      updateData.password_hash = await bcrypt.hash(openPass, salt);
    }
    if (contactNo !== undefined) updateData.contactNo = contactNo;
    if (pictureLocation !== undefined) updateData.pictureLocation = pictureLocation;
    if (status) updateData.status = status;
    if (administrator !== undefined) updateData.administrator = administrator;

    // Update the super admin
    const result = await superAdminCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Super admin not found' },
        { status: 404 }
      );
    }

    console.log(`Updated super admin: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Super admin updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating super admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update super admin',
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

// DELETE - Delete a super admin user
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const superAdminCollection = db.collection(SUPER_ADMIN_COLLECTION);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Check if super admin exists
    const existingAdmin = await superAdminCollection.findOne({ _id: new ObjectId(id) });
    if (!existingAdmin) {
      return NextResponse.json(
        { error: 'Super admin not found' },
        { status: 404 }
      );
    }

    // Delete the super admin
    const result = await superAdminCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Super admin not found' },
        { status: 404 }
      );
    }

    console.log(`Deleted super admin: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Super admin deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting super admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete super admin',
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
