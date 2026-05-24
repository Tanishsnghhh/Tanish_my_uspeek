import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { EmployeeProfile } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get authorization header from request
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Verify JWT token and get user info
    const token = authorization.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded.corporateAccountId) {
      return NextResponse.json(
        { error: 'Missing account information in token' },
        { status: 401 }
      );
    }

    // Filter employees by corporate account
    const employees = await EmployeeProfile!.find({ 
      isActive: true,
      corporate_account_id: decoded.corporateAccountId
    }).lean();
    
    if (employees.length === 0) {
      // For debugging: let's also check if there are ANY active employees at all
      const totalEmployees = await EmployeeProfile!.countDocuments({ isActive: true });
      
      return NextResponse.json(
        { 
          error: 'No employees found for your account',
          debug: {
            accountId: decoded.corporateAccountId,
            totalActiveEmployees: totalEmployees
          }
        },
        { status: 404 }
      );
    }

    // Convert to CSV format - using actual database field names
    const csvHeaders = [
      '_id',
      'user_id',
      'first_name',
      'last_name',
      'phoneNumber',
      'department',
      'job_title',
      'employeeId',
      'hireDate',
      'isActive',
      'licenseId',
      'created_at',
      'updated_at'
    ];
    const csvRows = employees.map((emp: any) => [
      emp._id.toString(),
      emp.user_id?.toString() || '',
      `"${emp.first_name || ''}"`,
      `"${emp.last_name || ''}"`,
      `"${emp.phoneNumber || ''}"`,
      `"${emp.department || ''}"`,
      `"${emp.job_title || ''}"`,
      `"${emp.employeeId || ''}"`,
      emp.hireDate ? emp.hireDate.toISOString() : '',
      emp.isActive ? 'true' : 'false',
      emp.licenseId?.toString() || '',
      emp.created_at ? emp.created_at.toISOString() : '',
      emp.updated_at ? emp.updated_at.toISOString() : ''
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="employees_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during export' },
      { status: 500 }
    );
  }
}
