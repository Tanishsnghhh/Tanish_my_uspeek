import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const EMPLOYEE_PROFILES_COLLECTION = 'employeeprofiles';
const CORPORATE_ACCOUNTS_COLLECTION = 'corporateaccounts';
const DEPARTMENTS_COLLECTION = 'departments';

// GET - Fetch all departments with employee counts
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const employeeProfilesCollection = db.collection(EMPLOYEE_PROFILES_COLLECTION);
    const departmentsCollection = db.collection(DEPARTMENTS_COLLECTION);
    const corporateAccountsCollection = db.collection(CORPORATE_ACCOUNTS_COLLECTION);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const nameFilter = searchParams.get('name') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Step 1: Get all departments from the departments collection
    const createdDepartments = await departmentsCollection.find({
      isActive: true,
      ...(nameFilter && { name: { $regex: nameFilter, $options: 'i' } })
    }).toArray();

    // Step 2: Get departments from employee profiles with employee counts and IDs
    const employeeDeptPipeline: any[] = [
      {
        $match: {
          isActive: true,
          department: { $exists: true, $nin: [null, ''] }
        }
      },
      {
        $group: {
          _id: {
            department: '$department',
            corporate_account_id: '$corporate_account_id'
          },
          employeeCount: { $sum: 1 },
          employeeIds: { $push: '$_id' }, // Collect all employee IDs
          firstCreated: { $min: '$created_at' },
          lastUpdated: { $max: '$updated_at' }
        }
      }
    ];

    const employeeDepartments = await employeeProfilesCollection.aggregate(employeeDeptPipeline).toArray();

    // Step 3: Merge departments from both sources
    const departmentMap = new Map();

    // Add created departments
    for (const dept of createdDepartments) {
      const key = `${dept.name}-${dept.corporate_account_id.toString()}`;
      departmentMap.set(key, {
        department: dept.name,
        corporate_account_id: dept.corporate_account_id,
        companyName: dept.companyName || null,
        city: dept.city || null,
        state: dept.state || null,
        country: dept.country || null,
        region: dept.region || null,
        location: dept.location || null,
        employeeCount: dept.assignedEmployees ? dept.assignedEmployees.length : 0,
        assignedEmployees: dept.assignedEmployees || [],
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        status: dept.status || 'active'
      });
    }

    // Add/update with employee departments
    for (const dept of employeeDepartments) {
      const key = `${dept._id.department}-${dept._id.corporate_account_id.toString()}`;
      if (departmentMap.has(key)) {
        // Update existing with employee count and IDs
        const existing = departmentMap.get(key);
        existing.employeeCount = dept.employeeCount;
        existing.assignedEmployees = dept.employeeIds || [];
        existing.updatedAt = dept.lastUpdated;
      } else {
        // Add new department from employees
        departmentMap.set(key, {
          department: dept._id.department,
          corporate_account_id: dept._id.corporate_account_id,
          employeeCount: dept.employeeCount,
          assignedEmployees: dept.employeeIds || [],
          createdAt: dept.firstCreated,
          updatedAt: dept.lastUpdated,
          status: 'active'
        });
      }
    }

    // Convert map to array
    let allDepartments = Array.from(departmentMap.values());

    // Step 4: Lookup corporate account names
    const corporateAccountIds = [...new Set(allDepartments.map(d => d.corporate_account_id))];
    const corporateAccounts = await corporateAccountsCollection.find({
      _id: { $in: corporateAccountIds }
    }).toArray();

    const accountMap = new Map(corporateAccounts.map(acc => [acc._id.toString(), acc.companyName]));

    // Add company names and details (only if not already present from departments collection)
    allDepartments = allDepartments.map(dept => {
      const accountId = dept.corporate_account_id.toString();
      const account = corporateAccounts.find(acc => acc._id.toString() === accountId);
      
      return {
        ...dept,
        companyName: dept.companyName || accountMap.get(accountId) || 'N/A',
        city: dept.city || (account ? account.city : null),
        state: dept.state || (account ? account.state : null),
        country: dept.country || (account ? account.country : null),
        region: dept.region || (account ? account.region : null),
        location: dept.location || (account ? account.location : null)
      };
    });

    // Sort by department name
    allDepartments.sort((a, b) => a.department.localeCompare(b.department));

    // Apply name filter if needed (for company name)
    if (nameFilter) {
      allDepartments = allDepartments.filter(dept =>
        dept.department.toLowerCase().includes(nameFilter.toLowerCase()) ||
        dept.companyName.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Get total count
    const totalCount = allDepartments.length;

    // Apply pagination
    const paginatedDepartments = allDepartments.slice(skip, skip + limit);

    // Format the response data
    const formattedDepartments = paginatedDepartments.map((dept, index) => {
      // Create a unique ID by combining department name and corporate account ID
      const uniqueId = `${dept.department}-${dept.corporate_account_id ? dept.corporate_account_id.toString() : 'no-account'}`;
      
      return {
        departmentId: uniqueId,
        name: dept.department,
        code: dept.department, // Using department name as code
        companyName: dept.companyName || 'N/A',
        city: dept.city || 'N/A',
        state: dept.state || 'N/A',
        country: dept.country || 'N/A',
        region: dept.region || 'N/A',
        location: dept.location || 'N/A',
        corporate_account_id: dept.corporate_account_id ? dept.corporate_account_id.toString() : null,
        employeeCount: dept.employeeCount,
        assignedEmployees: dept.assignedEmployees ? dept.assignedEmployees.map((id: any) => id.toString()) : [],
        status: dept.status,
        createdOn: dept.createdAt ? new Date(dept.createdAt).toLocaleDateString('en-GB') : 'N/A',
        updatedOn: dept.updatedAt ? new Date(dept.updatedAt).toLocaleDateString('en-GB') : 'N/A',
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt
      };
    });

    console.log(`Fetched ${formattedDepartments.length} departments out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: {
        departments: formattedDepartments,
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
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch departments',
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

// POST - Create a new department
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const body = await request.json();
    const { 
      departmentName,
      corporateAccountId
    } = body;

    // Validate required fields
    if (!departmentName || !corporateAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: departmentName, corporateAccountId' },
        { status: 400 }
      );
    }

    const departmentsCollection = db.collection(DEPARTMENTS_COLLECTION);
    const corporateAccountsCollection = db.collection(CORPORATE_ACCOUNTS_COLLECTION);
    
    // Check if department already exists in departments collection
    const existingDepartment = await departmentsCollection.findOne({
      name: departmentName,
      corporate_account_id: new ObjectId(corporateAccountId),
      isActive: true
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department already exists for this corporate account' },
        { status: 409 }
      );
    }

    // Fetch corporate account details to get company info
    const corporateAccount = await corporateAccountsCollection.findOne({
      _id: new ObjectId(corporateAccountId)
    });

    if (!corporateAccount) {
      return NextResponse.json(
        { error: 'Corporate account not found' },
        { status: 404 }
      );
    }

    // Create new department document with company details
    const newDepartment = {
      name: departmentName,
      code: departmentName,
      corporate_account_id: new ObjectId(corporateAccountId),
      companyName: corporateAccount.companyName || '',
      city: corporateAccount.city || '',
      state: corporateAccount.state || '',
      country: corporateAccount.country || '',
      region: corporateAccount.region || '',
      location: corporateAccount.location || '',
      assignedEmployees: [], // Array of employee IDs
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await departmentsCollection.insertOne(newDepartment);

    console.log(`Created new department: ${departmentName} for corporate account: ${corporateAccountId} (${corporateAccount.companyName})`);

    return NextResponse.json({
      success: true,
      message: 'Department created successfully!',
      data: {
        departmentId: result.insertedId.toString(),
        departmentName,
        corporateAccountId,
        companyName: corporateAccount.companyName,
        city: corporateAccount.city,
        state: corporateAccount.state,
        country: corporateAccount.country
      }
    });

  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create department',
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
