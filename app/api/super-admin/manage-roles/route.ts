import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectDB();
    
    // Get all distinct job titles from EmployeeProfiles with counts and metadata
    const employeeProfiles = db.collection('employeeprofiles');
    
    // Aggregate to get unique job titles with counts and first created date
    const jobTitlesAggregation = await employeeProfiles.aggregate([
      {
        $match: {
          job_title: { $exists: true, $nin: [null, ''] }
        }
      },
      {
        $group: {
          _id: '$job_title',
          count: { $sum: 1 },
          firstCreated: { $min: '$created_at' },
          lastUpdated: { $max: '$updated_at' }
        }
      },
      {
        $sort: { firstCreated: -1 }
      }
    ]).toArray();

    // Get user roles distribution
    const users = db.collection('users');
    const userRolesAggregation = await users.aggregate([
      {
        $match: {
          role: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          firstCreated: { $min: '$created_at' },
          lastUpdated: { $max: '$updated_at' }
        }
      }
    ]).toArray();

    // Format job titles data
    const jobTitlesData = jobTitlesAggregation.map((item, index) => ({
      id: item._id,
      roleId: `JT-${index + 1}`,
      role: item._id,
      code: item._id,
      type: 'Job Title',
      count: item.count,
      createDate: item.firstCreated ? new Date(item.firstCreated).toLocaleDateString('en-GB') : 'N/A',
      updatedDate: item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-GB') : 'N/A',
      rawCreateDate: item.firstCreated
    }));

    // Format user roles data
    const userRolesData = userRolesAggregation.map((item, index) => ({
      id: item._id,
      roleId: `UR-${index + 1}`,
      role: item._id,
      code: item._id,
      type: 'System Role',
      count: item.count,
      createDate: item.firstCreated ? new Date(item.firstCreated).toLocaleDateString('en-GB') : 'N/A',
      updatedDate: item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-GB') : 'N/A',
      rawCreateDate: item.firstCreated
    }));

    // Get custom roles from the roles collection
    const rolesCollection = db.collection('roles');
    const customRoles = await rolesCollection.find({}).toArray();
    
    // Format custom roles data
    const customRolesData = customRoles.map((item, index) => ({
      id: item._id.toString(),
      roleId: `CR-${index + 1}`,
      role: item.role,
      code: item.code,
      type: item.type,
      count: item.count || 0,
      createDate: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : 'N/A',
      updatedDate: item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-GB') : 'N/A',
      rawCreateDate: item.created_at
    }));

    // Combine all arrays
    const allRoles = [...jobTitlesData, ...userRolesData, ...customRolesData];

    // Sort by creation date (most recent first)
    allRoles.sort((a, b) => {
      const dateA = a.rawCreateDate ? new Date(a.rawCreateDate).getTime() : 0;
      const dateB = b.rawCreateDate ? new Date(b.rawCreateDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      roles: allRoles,
      totalRoles: allRoles.length,
      stats: {
        totalJobTitles: jobTitlesData.length,
        totalSystemRoles: userRolesData.length,
        totalCustomRoles: customRolesData.length,
        totalEmployeesWithJobTitles: jobTitlesAggregation.reduce((acc, item) => acc + item.count, 0),
        totalUsersWithRoles: userRolesAggregation.reduce((acc, item) => acc + item.count, 0),
        totalCustomRoleUsers: customRolesData.reduce((acc, item) => acc + item.count, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, code, type = 'Job Title' } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    
    // Create a dedicated roles collection to store custom roles
    const rolesCollection = db.collection('roles');
    
    // Check if role already exists
    const existingRole = await rolesCollection.findOne({ 
      role: role.trim(),
      type: type 
    });
    
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role already exists' },
        { status: 400 }
      );
    }
    
    // Create new role document
    const newRole = {
      role: role.trim(),
      code: code?.trim() || role.trim(),
      type: type,
      count: 0, // Initially no users assigned
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert the new role
    const result = await rolesCollection.insertOne(newRole);
    
    if (result.insertedId) {
      return NextResponse.json({
        success: true,
        message: 'Role created successfully',
        role: {
          id: result.insertedId.toString(),
          role: newRole.role,
          code: newRole.code,
          type: newRole.type,
          count: newRole.count,
          createDate: newRole.created_at.toLocaleDateString('en-GB')
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create role' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldRole, newRole, type } = body;

    if (!oldRole || !newRole) {
      return NextResponse.json(
        { success: false, error: 'Old role and new role are required' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    
    if (type === 'Job Title') {
      // Update all employee profiles with this job title
      const employeeProfiles = db.collection('employeeprofiles');
      const result = await employeeProfiles.updateMany(
        { job_title: oldRole },
        { 
          $set: { 
            job_title: newRole,
            updated_at: new Date()
          } 
        }
      );

      return NextResponse.json({
        success: true,
        message: `Updated ${result.modifiedCount} employee profiles`,
        modifiedCount: result.modifiedCount
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be modified' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
