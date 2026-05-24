import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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
        const corporateAccountId = decoded.account_id || decoded.corporateAccountId;
        if (!corporateAccountId) {
            return NextResponse.json(
                { error: 'Corporate account ID not found' },
                { status: 400 }
            );
        }

        console.log('Corporate Account ID from token:', corporateAccountId);
        console.log('Decoded token data:', {
            userId: decoded.userId,
            role: decoded.role,
            corporateAccountId: decoded.corporateAccountId,
            account_id: decoded.account_id
        });

        const { searchParams } = new URL(request.url);

        const region = searchParams.get('region');

        if (!region) {
            return NextResponse.json(
                { error: 'Region parameter is required' },
                { status: 400 }
            );
        }

        // Check both collections: videouploadactivities and employeeprofiles for organizational data
        const videoUploadActivities = db.collection('videouploadactivities');
        const employeeProfiles = db.collection('employeeprofiles');

        // First try videouploadactivities with corporate account filtering
        const activities = await videoUploadActivities.find({
            'organizationInfo.region': region.toUpperCase(),
            corporate_account_id: new ObjectId(corporateAccountId)
        }).toArray();

        console.log(`Found ${activities.length} video upload activities for region ${region}`);

        let zones: string[] = [];
        let batches: string[] = [];
        let branches: string[] = [];
        let employees: any[] = [];

        if (activities.length > 0) {
            // Extract from videouploadactivities
            zones = [...new Set(activities
                .map(a => a.organizationInfo?.zone)
                .filter(z => z && z !== 'Unknown' && z !== '')
            )].sort();

            batches = [...new Set(activities
                .map(a => a.organizationInfo?.batch)
                .filter(b => b && b !== 'Unknown' && b !== '')
            )].sort();

            branches = [...new Set(activities
                .map(a => a.organizationInfo?.branch)
                .filter(br => br && br !== 'Unknown' && br !== '')
            )].sort();
        } else {
            // Fallback to employeeprofiles collection
            console.log(`No video upload activities found, checking employeeprofiles for region ${region}`);
            
            employees = await employeeProfiles.find({
                'custom_attributes.position_1': region.toUpperCase(),
                corporate_account_id: new ObjectId(corporateAccountId)
            }).toArray();

            console.log(`Found ${employees.length} employees in region ${region}`);

            if (employees.length > 0) {
                zones = [...new Set(employees
                    .map(e => e.custom_attributes?.position_2)
                    .filter(z => z && z !== 'Unknown' && z !== '')
                )].sort();

                batches = [...new Set(employees
                    .map(e => e.custom_attributes?.position_3)
                    .filter(b => b && b !== 'Unknown' && b !== '')
                )].sort();

                branches = [...new Set(employees
                    .map(e => e.custom_attributes?.position_4)
                    .filter(br => br && br !== 'Unknown' && br !== '')
                )].sort();
            }
        }


        console.log('Final response data:', {
            region: region.toUpperCase(),
            zones,
            batches,
            branches,
            totalActivities: activities.length,
            totalEmployees: employees?.length || 0
        });

        return NextResponse.json({
            success: true,
            region: region.toUpperCase(),
            zones,
            batches,
            branches,
            totalActivities: activities.length,
            totalEmployees: employees?.length || 0,
            dataSource: activities.length > 0 ? 'videouploadactivities' : 'employeeprofiles'
        });

    } catch (error) {
        console.error('Error fetching organizational hierarchy:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organizational hierarchy' },
            { status: 500 }
        );
    }
}
