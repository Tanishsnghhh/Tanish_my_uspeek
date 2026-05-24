import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

interface BusinessUnit {
  _id?: ObjectId;
  businessName: string;
  businessCode: string;
  businessCategory: string;
  region: string;
  zone?: string;
  batch?: string;
  branch?: string;
  assignedEmployees: string[]; // Array of employee IDs
  corporate_account_id: ObjectId; // Reference to CorporateAccount
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Create a new business unit
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectDB();
    
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get corporate account ID from token
    const corporateAccountId = decoded.corporateAccountId || decoded.account_id;
    if (!corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      businessName,
      businessCode,
      businessCategory,
      region,
      zone,
      batch,
      branch,
      accountId
    } = body;

    // Validate required fields
    if (!businessName || !businessCode || !businessCategory || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, businessCode, businessCategory, region' },
        { status: 400 }
      );
    }

    const businessUnits = db.collection('businessunits');

    // Check if business code already exists
    const existingUnit = await businessUnits.findOne({ businessCode });
    if (existingUnit) {
      return NextResponse.json(
        { error: 'Business code already exists' },
        { status: 409 }
      );
    }

    // Create new business unit
    const newBusinessUnit: Omit<BusinessUnit, '_id'> = {
      businessName,
      businessCode,
      businessCategory,
      region,
      zone,
      batch,
      branch,
      assignedEmployees: [],
      corporate_account_id: new ObjectId(corporateAccountId), // Include corporate account ID
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await businessUnits.insertOne(newBusinessUnit);

    return NextResponse.json({
      success: true,
      message: 'Business unit created successfully',
      businessUnitId: result.insertedId,
      businessUnit: { ...newBusinessUnit, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Error creating business unit:', error);
    return NextResponse.json(
      { error: 'Failed to create business unit' },
      { status: 500 }
    );
  }
}

// Get all business units
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectDB();
    
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get corporate account ID from token
    const corporateAccountId = decoded.corporateAccountId || decoded.account_id;
    if (!corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    const region = searchParams.get('region');
    const isActive = searchParams.get('isActive');

    // Build filter with corporate account filtering
    const filter: any = { 
      isActive: true,
      corporate_account_id: new ObjectId(corporateAccountId)
    };
    if (region) filter.region = region;
    if (isActive !== null) filter.isActive = isActive === 'true';

    // Fetch from businessunits collection
    const businessUnitsCollection = db.collection('businessunits');
    const businessUnits = await businessUnitsCollection.find(filter).sort({ createdAt: -1 }).toArray();

    // Enrich with employee details for each business unit
    const unitsWithDetails = await Promise.all(
      businessUnits.map(async (unit) => {
        let assignedEmployees: any[] = [];
        let assignedEmployeeIds: string[] = unit.assignedEmployees || [];

        if (assignedEmployeeIds.length > 0) {
          // Get employee details
          const employeeProfiles = db.collection('employeeprofiles');
          const employees = await employeeProfiles.find({
            _id: { $in: assignedEmployeeIds.map((id: string) => new ObjectId(id)) },
            corporate_account_id: new ObjectId(corporateAccountId)
          }).toArray();

          assignedEmployees = employees.map(emp => ({
            id: emp._id,
            name: `${emp.first_name || emp.firstName || 'Unknown'} ${emp.last_name || emp.lastName || 'Employee'}`,
            email: emp.email,
            department: emp.department,
            jobTitle: emp.job_title || emp.jobTitle
          }));
        }

        return {
          _id: unit._id,
          businessName: unit.businessName,
          businessCode: unit.businessCode,
          businessCategory: unit.businessCategory,
          region: unit.region,
          zone: unit.zone,
          batch: unit.batch,
          branch: unit.branch,
          assignedEmployees: assignedEmployeeIds,
          totalEmployees: assignedEmployeeIds.length,
          assignedEmployeeDetails: assignedEmployees,
          isActive: unit.isActive,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: unitsWithDetails.length,
      businessUnits: unitsWithDetails
    });

  } catch (error) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business units' },
      { status: 500 }
    );
  }
}

// Update business unit (assign/unassign employees)
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectDB();
    
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get corporate account ID from token
    const corporateAccountId = decoded.corporateAccountId || decoded.account_id;
    if (!corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      businessUnitId,
      action, // 'assign' or 'unassign'
      employeeId,
      updateData // For general updates
    } = body;

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit ID is required' },
        { status: 400 }
      );
    }

    const businessUnits = db.collection('businessunits');

    // Find the business unit directly in businessunits collection with corporate account filtering
    let unitRecord = await businessUnits.findOne({ 
      _id: new ObjectId(businessUnitId),
      corporate_account_id: new ObjectId(corporateAccountId)
    });

    if (!unitRecord) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      );
    }

    if (action === 'assign' && employeeId) {
      // Assign employee to business unit
      const result = await businessUnits.updateOne(
        { _id: new ObjectId(businessUnitId) },
        {
          $addToSet: { assignedEmployees: employeeId },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Business unit not found' },
          { status: 404 }
        );
      }

      // Sync employee videos to company collection
      await syncEmployeeVideosToCompany(db, businessUnitId, employeeId);

      // Trigger business metrics recalculation for this business unit
      await triggerBusinessMetricsCalculation(db, businessUnitId);

      return NextResponse.json({
        success: true,
        message: 'Employee assigned successfully'
      });

    } else if (action === 'unassign' && employeeId) {
      // Unassign employee from business unit
      console.log('Unassigning employee:', { businessUnitId, employeeId });
      console.log('Unit record before unassignment:', unitRecord);

      const result = await businessUnits.updateOne(
        { _id: new ObjectId(businessUnitId) },
        {
          $pull: { assignedEmployees: employeeId },
          $set: { updatedAt: new Date() }
        }
      );

      console.log('Update result:', result);

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Business unit not found' },
          { status: 404 }
        );
      }

      // Verify the update
      const updatedUnit = await businessUnits.findOne({ _id: new ObjectId(businessUnitId) });
      console.log('Unit record after unassignment:', updatedUnit);

      // Trigger business metrics recalculation for this business unit
      await triggerBusinessMetricsCalculation(db, businessUnitId);

      return NextResponse.json({
        success: true,
        message: 'Employee unassigned successfully'
      });

    } else if (updateData) {
      // General update
      const result = await businessUnits.updateOne(
        { _id: new ObjectId(businessUnitId) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Business unit not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Business unit updated successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating business unit:', error);
    return NextResponse.json(
      { error: 'Failed to update business unit' },
      { status: 500 }
    );
  }
}
// Helper function to sync employee videos to company collection
async function syncEmployeeVideosToCompany(db: any, businessUnitId: string, employeeId: string) {
  try {
    const businessUnits = db.collection('businessunits');
    const employeeProfiles = db.collection('employeeprofiles');
    const videoAnalysis = db.collection('video_analysis');
    const companyCollection = db.collection('companyemployeevideoupload');

    // Get business unit info
    const unit = await businessUnits.findOne({ _id: new ObjectId(businessUnitId) });
    if (!unit) return;

    // Get employee profile
    const employee = await employeeProfiles.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return;

    console.log(`Syncing videos for employee ${employee.first_name} ${employee.last_name} to business unit ${unit.businessName}`);

    // Find videos for this employee
    const userIdPattern = `EMPLOYEE:${employee.user_id}`;
    const videos = await videoAnalysis.find({
      'uploadInfo.userId': userIdPattern
    }).toArray();

    console.log(`Found ${videos.length} videos to sync`);

    // Remove existing entries for this employee from company collection
    await companyCollection.deleteMany({
      'employeeInfo.employeeProfileId': new ObjectId(employeeId)
    });

    // Create company collection documents for each video
    for (const video of videos) {
      const companyDoc = {
        uploadId: video.uploadInfo?.uploadId || video._id.toString(),
        userId: video.uploadInfo?.userId,
        employeeId: employee.employeeId,
        uploadDate: video.uploadInfo?.uploadDate,
        filename: video.uploadInfo?.filename,
        fileSize: video.uploadInfo?.fileSize,
        duration: video.uploadInfo?.duration,
        
        employeeInfo: {
          employeeProfileId: employee._id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          fullName: `${employee.first_name} ${employee.last_name}`.trim(),
          employeeId: employee.employeeId,
          phoneNumber: employee.phone,
          department: employee.department,
          jobTitle: employee.job_title,
          hireDate: employee.hireDate,
          isActive: employee.isActive !== undefined ? employee.isActive : true
        },
        
        businessInfo: {
          businessUnitId: unit._id,
          businessName: unit.businessName,
          businessCode: unit.businessCode,
          businessCategory: unit.businessCategory,
          assignedDate: new Date()
        },
        
        organizationInfo: {
          region: employee.custom_attributes?.position_1 || 'Unknown',
          zone: employee.custom_attributes?.position_2 || 'Unknown',
          batch: employee.custom_attributes?.position_3 || 'Unknown',
          branch: employee.custom_attributes?.position_4 || 'Unknown'
        },
        
        uploadInfo: {
          uploadDate: video.uploadInfo?.uploadDate,
          uploadTime: video.uploadInfo?.uploadDate ? new Date(video.uploadInfo.uploadDate).toTimeString() : '',
          dayOfWeek: video.uploadInfo?.uploadDate ? new Date(video.uploadInfo.uploadDate).toLocaleDateString('en-US', { weekday: 'long' }) : '',
          weekOfYear: video.uploadInfo?.uploadDate ? getWeekOfYear(new Date(video.uploadInfo.uploadDate)) : 0,
          monthYear: video.uploadInfo?.uploadDate ? new Date(video.uploadInfo.uploadDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
          quarter: video.uploadInfo?.uploadDate ? `Q${Math.ceil((new Date(video.uploadInfo.uploadDate).getMonth() + 1) / 3)} ${new Date(video.uploadInfo.uploadDate).getFullYear()}` : '',
          uploadSource: 'web'
        },
        
        analysisStatus: {
          isAnalyzed: !!(video.bodyLanguageAnalysis && video.vocalAnalysis && video.wordPowerAnalysis),
          analysisDate: video.uploadInfo?.uploadDate,
          bodyLanguageScore: video.bodyLanguageAnalysis?.overallScore,
          vocalToneScore: video.vocalAnalysis?.overallScore,
          wordPowerScore: video.wordPowerAnalysis?.overallScore,
          overallScore: video.overallPerformance?.overallScore,
          analysisVersion: '2.0'
        },
        
        metadata: {
          syncedFrom: 'video_analysis',
          syncedAt: new Date(),
          originalVideoAnalysisId: video._id,
          version: '2.0'
        }
      };
      
      await companyCollection.insertOne(companyDoc);
    }

    console.log(`Synced ${videos.length} videos for employee ${employee.first_name} ${employee.last_name}`);
    
  } catch (error) {
    console.error('Error syncing employee videos:', error);
  }
}

// Helper function to trigger business metrics calculation
async function triggerBusinessMetricsCalculation(db: any, businessUnitId: string) {
  try {
    const businessUnits = db.collection('businessunits');
    const unit = await businessUnits.findOne({ _id: new ObjectId(businessUnitId) });
    
    if (!unit) return;

    // Call the business metrics calculation using the trigger service
    try {
      const { triggerBusinessMetricsCalculation } = await import('@/lib/services/business-metrics-trigger');
      
      const result = await triggerBusinessMetricsCalculation({
        region: unit.region,
        zone: unit.zone,
        batch: unit.batch,
        branch: unit.branch,
        accountId: unit.corporate_account_id?.toString(),
        periodType: 'all-time'
      });

      if (result.success) {
        console.log(`Business metrics recalculated for ${unit.businessName}`);
      } else {
        console.error(`Failed to recalculate business metrics for ${unit.businessName}:`, result.error);
      }
    } catch (error) {
      console.error('Error triggering business metrics calculation:', error);
    }
  } catch (error) {
    console.error('Error triggering business metrics calculation:', error);
  }
}

function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}