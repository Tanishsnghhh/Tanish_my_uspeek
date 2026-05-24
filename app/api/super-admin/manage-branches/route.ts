import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const CORPORATE_ACCOUNTS_COLLECTION = 'corporateaccounts';
const BUSINESS_UNITS_COLLECTION = 'businessunits';

// GET - Fetch branches data from corporate accounts and business units
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const corporateAccountsCollection = db.collection(CORPORATE_ACCOUNTS_COLLECTION);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const nameFilter = searchParams.get('name') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline to expand all branches with their corporate account info
    const pipeline: any[] = [
      // Match only active corporate accounts
      {
        $match: {
          status: 'ACTIVE'
        }
      },
      // Lookup business units for each corporate account
      {
        $lookup: {
          from: BUSINESS_UNITS_COLLECTION,
          let: { accountId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$corporate_account_id', '$$accountId']
                },
                isActive: true
              }
            }
          ],
          as: 'businessUnits'
        }
      },
      // Unwind business units to create one document per branch
      {
        $unwind: {
          path: '$businessUnits',
          preserveNullAndEmptyArrays: true // Keep corporate accounts with no business units
        }
      },
      // Project the fields we need in a flat structure
      {
        $project: {
          _id: 1,
          corporateAccountId: '$_id',
          companyName: 1,
          city: 1,
          state: 1,
          country: 1,
          location: 1,
          createdAt: 1,
          // Business unit fields
          businessUnitId: '$businessUnits._id',
          businessName: '$businessUnits.businessName',
          businessCode: '$businessUnits.businessCode',
          branch: '$businessUnits.branch',
          region: '$businessUnits.region',
          zone: '$businessUnits.zone',
          batch: '$businessUnits.batch',
          businessCategory: '$businessUnits.businessCategory',
          assignedEmployees: '$businessUnits.assignedEmployees'
        }
      },
      // Sort by creation date (newest first)
      {
        $sort: { createdAt: -1 }
      }
    ];

    // Add name filter if provided (search across all relevant fields)
    if (nameFilter) {
      pipeline.splice(3, 0, {
        $match: {
          $or: [
            { companyName: { $regex: nameFilter, $options: 'i' } },
            { city: { $regex: nameFilter, $options: 'i' } },
            { state: { $regex: nameFilter, $options: 'i' } },
            { country: { $regex: nameFilter, $options: 'i' } },
            { location: { $regex: nameFilter, $options: 'i' } },
            { branch: { $regex: nameFilter, $options: 'i' } },
            { businessName: { $regex: nameFilter, $options: 'i' } },
            { businessCode: { $regex: nameFilter, $options: 'i' } }
          ]
        }
      });
    }

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await corporateAccountsCollection.aggregate(countPipeline).toArray();
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const branches = await corporateAccountsCollection.aggregate(pipeline).toArray();

    // Format the response data
    const formattedBranches = branches.map((branch) => {
      const accountId = branch.corporateAccountId.toString();
      
      // If there's a business unit, use its data
      if (branch.businessUnitId) {
        return {
          branchId: branch.businessUnitId.toString(),
          branchName: branch.branch || branch.businessName || 'Main Branch',
          address: `${branch.businessName || branch.companyName} - ${branch.branch || 'Main Branch'}`,
          city: branch.city || 'N/A',
          state: branch.state || 'N/A',
          country: branch.country || 'N/A',
          createdOn: branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('en-GB') : 'N/A',
          // Additional fields
          corporateAccountId: accountId,
          companyName: branch.companyName,
          businessCode: branch.businessCode,
          businessCategory: branch.businessCategory,
          region: branch.region,
          zone: branch.zone,
          batch: branch.batch,
          assignedEmployeesCount: branch.assignedEmployees ? branch.assignedEmployees.length : 0,
          createdAt: branch.createdAt
        };
      } else {
        // If no business unit, show the corporate account itself
        return {
          branchId: accountId,
          branchName: branch.companyName,
          address: branch.location || branch.companyName,
          city: branch.city || 'N/A',
          state: branch.state || 'N/A',
          country: branch.country || 'N/A',
          createdOn: branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('en-GB') : 'N/A',
          corporateAccountId: accountId,
          companyName: branch.companyName,
          location: branch.location,
          createdAt: branch.createdAt
        };
      }
    });

    console.log(`Fetched ${formattedBranches.length} branches out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: {
        branches: formattedBranches,
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
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch branches',
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

// POST - Create a new branch (business unit)
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    const body = await request.json();
    const { 
      branchName, 
      address, 
      city, 
      state, 
      country, 
      businessCode, 
      businessCategory, 
      region, 
      zone, 
      batch,
      corporateAccountId 
    } = body;

    // Validate required fields
    if (!branchName || !businessCode || !businessCategory || !region || !corporateAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: branchName, businessCode, businessCategory, region, corporateAccountId' },
        { status: 400 }
      );
    }

    // Check if business code already exists
    const existingUnit = await businessUnitsCollection.findOne({ businessCode });
    if (existingUnit) {
      return NextResponse.json(
        { error: 'Business code already exists' },
        { status: 409 }
      );
    }

    // Create new business unit (branch)
    const newBusinessUnit = {
      businessName: branchName,
      businessCode: businessCode,
      businessCategory: businessCategory,
      region: region,
      zone: zone || city || '',
      batch: batch || '',
      branch: branchName,
      corporate_account_id: new ObjectId(corporateAccountId),
      assignedEmployees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await businessUnitsCollection.insertOne(newBusinessUnit);

    console.log(`Created new branch: ${branchName} for corporate account: ${corporateAccountId}`);

    return NextResponse.json({
      success: true,
      message: 'Branch created successfully',
      data: {
        branchId: result.insertedId.toString(),
        branchName: newBusinessUnit.businessName,
        businessCode: newBusinessUnit.businessCode,
        region: newBusinessUnit.region
      }
    });

  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create branch',
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

// PUT - Update a branch (business unit)
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    const body = await request.json();
    const { branchId, branchName, address, city, state, country, businessCode, businessCategory, region, zone, batch } = body;

    // Validate required fields
    if (!branchId) {
      return NextResponse.json(
        { error: 'Missing required field: branchId' },
        { status: 400 }
      );
    }

    // Check if business unit exists
    const existingUnit = await businessUnitsCollection.findOne({ _id: new ObjectId(branchId) });
    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (branchName) updateData.businessName = branchName;
    if (businessCode) updateData.businessCode = businessCode;
    if (businessCategory) updateData.businessCategory = businessCategory;
    if (region) updateData.region = region;
    if (zone !== undefined) updateData.zone = zone;
    if (batch !== undefined) updateData.batch = batch;
    if (branchName) updateData.branch = branchName;

    // Update the business unit
    const result = await businessUnitsCollection.updateOne(
      { _id: new ObjectId(branchId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    console.log(`Updated branch: ${branchId}`);

    return NextResponse.json({
      success: true,
      message: 'Branch updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update branch',
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

// DELETE - Delete a branch (business unit)
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json(
        { error: 'Missing required parameter: branchId' },
        { status: 400 }
      );
    }

    // Check if business unit exists
    const existingUnit = await businessUnitsCollection.findOne({ _id: new ObjectId(branchId) });
    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await businessUnitsCollection.updateOne(
      { _id: new ObjectId(branchId) },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    console.log(`Deleted branch: ${branchId}`);

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete branch',
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