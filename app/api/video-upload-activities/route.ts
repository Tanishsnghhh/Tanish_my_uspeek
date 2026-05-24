import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Interface for the videouploadactivities collection
interface VideoUploadActivity {
    _id?: ObjectId;
    uploadId: string;
    userId: string;
    employeeId: string;
    corporate_account_id: ObjectId; // Reference to CorporateAccount
    uploadDate: Date;
    filename: string;
    fileSize?: number;
    duration?: number;

    // Employee Details
    employeeInfo: {
        firstName: string;
        lastName: string;
        fullName: string;
        employeeId: string;
        phoneNumber?: string;
        department?: string;
        jobTitle?: string;
        hireDate?: Date;
        isActive: boolean;
    };

    // Organizational Structure
    organizationInfo: {
        region: string;        // position_1
        zone: string;          // position_2  
        batch: string;         // position_3
        branch: string;        // position_4
    };

    // Upload Details
    uploadInfo: {
        uploadDate: Date;
        uploadTime: string;
        dayOfWeek: string;
        weekOfYear: number;
        monthYear: string;
        quarter: string;
        uploadSource?: string; // web, mobile, etc.
        ipAddress?: string;
    };

    // Analysis Status
    analysisStatus: {
        isAnalyzed: boolean;
        analysisDate?: Date;
        bodyLanguageScore?: number;
        vocalToneScore?: number;
        wordPowerScore?: number;
        overallScore?: number;
        analysisVersion?: string;
    };

    // Metadata
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        source: string; // 'video_upload', 'manual_entry', etc.
        version: number;
    };
}

// Interface for creating new video upload activities (without _id)
type CreateVideoUploadActivity = Omit<VideoUploadActivity, '_id'>;

// Function to create a video upload activity record
export async function POST(request: Request) {
    try {
        const { db } = await connectDB();
        const body = await request.json();

        const {
            uploadId,
            userId,
            filename,
            fileSize,
            duration,
            uploadSource,
            ipAddress
        } = body;

        // Get employee details - try multiple lookup methods
        const employeeProfiles = db.collection('employeeprofiles');

        // Extract the actual user ID from the userId (remove role prefix if present)
        const actualUserId = userId.replace(/^(EMPLOYEE:|ADMIN:|CORPORATE_ADMIN:)/, '');

        // Try multiple ways to find the employee
        let employee = null;

        // First try by user_id as ObjectId
        try {
            if (ObjectId.isValid(actualUserId)) {
                employee = await employeeProfiles.findOne({
                    user_id: new ObjectId(actualUserId)
                });
            }
        } catch (e) {
            // Ignore ObjectId errors
        }

        // If not found by user_id, try by _id (in case the userId is actually the _id)
        if (!employee) {
            try {
                if (ObjectId.isValid(actualUserId)) {
                    employee = await employeeProfiles.findOne({
                        _id: new ObjectId(actualUserId)
                    });
                }
            } catch (e) {
                // Ignore ObjectId errors
            }
        }

        // If still not found, try by employeeId
        if (!employee) {
            employee = await employeeProfiles.findOne({
                employeeId: actualUserId
            });
        }

        if (!employee) {
            console.error(`Employee not found for userId: ${userId}, actualUserId: ${actualUserId}`);
            return NextResponse.json(
                { error: `Employee not found for userId: ${userId}` },
                { status: 404 }
            );
        }

        console.log(`Found employee: ${employee.first_name} ${employee.last_name} for userId: ${userId}`);

        // Find the business unit this employee belongs to
        const businessUnits = db.collection('businessunits');
        let employeeBusinessId = undefined;
        let employeeBusiness = null;

        // Try to find business unit by assigned employees (handle ObjectId to string conversion)
        if (employee) {
            const assignedEmployeesStrings = employee._id ? [employee._id.toString(), employee.user_id?.toString()].filter(Boolean) : [employee.user_id?.toString()].filter(Boolean);
            
            const businessUnit = await businessUnits.findOne({
                assignedEmployees: { $in: assignedEmployeesStrings }
            });
            
            if (businessUnit) {
                employeeBusinessId = businessUnit.businessCode;
                employeeBusiness = businessUnit;
                console.log(`Found business unit: ${businessUnit.businessName} (${businessUnit.businessCode}) for employee`);
            }
        }

        // Prepare upload date information
        const uploadDate = new Date();
        const uploadTime = uploadDate.toTimeString().split(' ')[0];
        const dayOfWeek = uploadDate.toLocaleDateString('en-US', { weekday: 'long' });
        const weekOfYear = getWeekOfYear(uploadDate);
        const monthYear = uploadDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const quarter = `Q${Math.ceil((uploadDate.getMonth() + 1) / 3)} ${uploadDate.getFullYear()}`;

        // Get corporate account ID from employee or user
        let corporateAccountId = employee.corporate_account_id;
        
        // If employee doesn't have corporate_account_id, get it from the user
        if (!corporateAccountId && employee.user_id) {
            try {
                const users = db.collection('users');
                const user = await users.findOne({ _id: employee.user_id });
                if (user && user.account_id) {
                    corporateAccountId = user.account_id;
                }
            } catch (error) {
                console.error('Error getting corporate account ID from user:', error);
            }
        }

        // Create the activity record
        const activity: CreateVideoUploadActivity = {
            uploadId,
            userId,
            employeeId: employee.employeeId || employee.user_id,
            corporate_account_id: corporateAccountId,
            uploadDate,
            filename,
            fileSize,
            duration,

            employeeInfo: {
                firstName: employee.first_name || '',
                lastName: employee.last_name || '',
                fullName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
                employeeId: employee.employeeId || employee.user_id,
                phoneNumber: employee.phoneNumber,
                department: employee.department,
                jobTitle: employee.job_title,
                hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
                isActive: employee.isActive !== false
            },

            organizationInfo: {
                region: employee.custom_attributes?.position_1 || 'Unknown',
                zone: employee.custom_attributes?.position_2 || 'Unknown',
                batch: employee.custom_attributes?.position_3 || 'Unknown',
                branch: employee.custom_attributes?.position_4 || 'Unknown'
            },

            uploadInfo: {
                uploadDate,
                uploadTime,
                dayOfWeek,
                weekOfYear,
                monthYear,
                quarter,
                uploadSource: uploadSource || 'web',
                ipAddress
            },

            analysisStatus: {
                isAnalyzed: false,
                analysisDate: undefined,
                bodyLanguageScore: undefined,
                vocalToneScore: undefined,
                wordPowerScore: undefined,
                overallScore: undefined,
                analysisVersion: undefined
            },

            metadata: {
                createdAt: uploadDate,
                updatedAt: uploadDate,
                source: 'video_upload',
                version: 1
            }
        };

        // Add businessId to the activity if found
        if (employeeBusinessId) {
            (activity as any).businessId = employeeBusinessId;
        }

        // Insert into videouploadactivities collection
        const videoUploadActivities = db.collection('videouploadactivities');
        const result = await videoUploadActivities.insertOne(activity);

        console.log(`Created video upload activity record for ${activity.employeeInfo.fullName} from ${activity.organizationInfo.region}`);

        return NextResponse.json({
            success: true,
            activityId: result.insertedId,
            message: 'Video upload activity recorded successfully'
        });

    } catch (error) {
        console.error('Error creating video upload activity:', error);
        return NextResponse.json(
            { error: 'Failed to create video upload activity' },
            { status: 500 }
        );
    }
}

// Function to update analysis status when video analysis is complete
export async function PATCH(request: Request) {
    try {
        const { db } = await connectDB();
        const body = await request.json();

        const {
            uploadId,
            bodyLanguageScore,
            vocalToneScore,
            wordPowerScore,
            analysisVersion
        } = body;

        const overallScore = (bodyLanguageScore + vocalToneScore + wordPowerScore) / 3;
        const analysisDate = new Date();

        const videoUploadActivities = db.collection('videouploadactivities');
        const result = await videoUploadActivities.updateOne(
            { uploadId },
            {
                $set: {
                    'analysisStatus.isAnalyzed': true,
                    'analysisStatus.analysisDate': analysisDate,
                    'analysisStatus.bodyLanguageScore': bodyLanguageScore,
                    'analysisStatus.vocalToneScore': vocalToneScore,
                    'analysisStatus.wordPowerScore': wordPowerScore,
                    'analysisStatus.overallScore': overallScore,
                    'analysisStatus.analysisVersion': analysisVersion || '1.0',
                    'metadata.updatedAt': analysisDate,
                    'metadata.version': { $inc: 1 }
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Video upload activity not found' },
                { status: 404 }
            );
        }

        console.log(`Updated analysis status for upload ${uploadId}`);

        // Trigger business metrics recalculation for affected business units
        await triggerBusinessMetricsRecalculation(db, uploadId);

        return NextResponse.json({
            success: true,
            message: 'Analysis status updated successfully'
        });

    } catch (error) {
        console.error('Error updating analysis status:', error);
        return NextResponse.json(
            { error: 'Failed to update analysis status' },
            { status: 500 }
        );
    }
}

// Get all video upload activities with filtering
export async function GET(request: Request) {
    try {
        const { db } = await connectDB();
        const { searchParams } = new URL(request.url);

        // Build filter based on query parameters
        const filter: any = {};

        const region = searchParams.get('region');
        const zone = searchParams.get('zone');
        const batch = searchParams.get('batch');
        const branch = searchParams.get('branch');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const isAnalyzed = searchParams.get('isAnalyzed');

        if (region) filter['organizationInfo.region'] = region;
        if (zone) filter['organizationInfo.zone'] = zone;
        if (batch) filter['organizationInfo.batch'] = batch;
        if (branch) filter['organizationInfo.branch'] = branch;
        if (isAnalyzed !== null) filter['analysisStatus.isAnalyzed'] = isAnalyzed === 'true';

        if (startDate || endDate) {
            filter.uploadDate = {};
            if (startDate) filter.uploadDate.$gte = new Date(startDate);
            if (endDate) filter.uploadDate.$lte = new Date(endDate);
        }

        const videoAnalysis = db.collection('video_analysis');
        const activities = await videoAnalysis
            .find(filter)
            .sort({ 'uploadInfo.uploadDate': -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        console.error('Error fetching video upload activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video upload activities' },
            { status: 500 }
        );
    }
}

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to trigger business metrics recalculation for affected business units
async function triggerBusinessMetricsRecalculation(db: any, uploadId: string) {
    try {
        const videoUploadActivities = db.collection('videouploadactivities');
        const businessUnits = db.collection('businessunits');

        // Find the video upload activity
        const activity = await videoUploadActivities.findOne({ uploadId });
        if (!activity) {
            console.log(`No video upload activity found for uploadId: ${uploadId}`);
            return;
        }

        // Extract the user ID (remove EMPLOYEE: prefix to match business unit assignments)
        const userId = activity.userId?.replace('EMPLOYEE:', '');
        if (!userId) {
            console.log(`No userId found in activity for uploadId: ${uploadId}`);
            return;
        }

        console.log(`Processing business metrics recalculation for user: ${userId}, uploadId: ${uploadId}`);

        // Find business units that have this user assigned
        const affectedBusinessUnits = await businessUnits.find({
            assignedEmployees: userId
        }).toArray();

        console.log(`Found ${affectedBusinessUnits.length} business units for user ${userId}`);

        // Trigger recalculation for each affected business unit
        for (const unit of affectedBusinessUnits) {
            try {
                console.log(`Triggering recalculation for business unit: ${unit.businessName} (${unit.businessCode})`);

                // Import the trigger service dynamically
                const { triggerBusinessMetricsCalculation } = await import('@/lib/services/business-metrics-trigger');

                const result = await triggerBusinessMetricsCalculation({
                    region: unit.region,
                    zone: unit.zone,
                    batch: unit.batch,
                    branch: unit.branch,
                    businessCode: unit.businessCode,
                    accountId: unit.corporate_account_id?.toString(),
                    periodType: 'all-time'
                });

                if (result.success) {
                    console.log(`✅ Business metrics recalculated for ${unit.businessName} after video analysis update`);
                } else {
                    console.error(`❌ Failed to recalculate business metrics for ${unit.businessName}:`, result.error);
                }
            } catch (error) {
                console.error(`❌ Error recalculating metrics for ${unit.businessName}:`, error);
            }
        }

        if (affectedBusinessUnits.length === 0) {
            console.log(`No business units found for user ${userId}. Business metrics will not be updated.`);
        }
    } catch (error) {
        console.error('❌ Error triggering business metrics recalculation:', error);
    }
}