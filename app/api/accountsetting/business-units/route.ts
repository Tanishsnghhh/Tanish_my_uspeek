import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Interface for business unit configuration
interface BusinessUnit {
  _id?: ObjectId;
  accountId: string;
  businessName: string;
  businessCode: string;
  businessCategory: string;
  description?: string;
  corporate_account_id: ObjectId; // Reference to CorporateAccount
  
  // Assignment criteria
  assignmentCriteria: {
    regions?: string[];
    zones?: string[];
    batches?: string[];
    branches?: string[];
    departments?: string[];
    jobTitles?: string[];
    specificEmployees?: string[]; // Employee IDs
  };
  
  // Business details
  businessDetails: {
    businessHead?: string;
    contactEmail?: string;
    budget?: number;
    targetMetrics?: {
      targetImprovementRate?: number;
      targetAnalysisRate?: number;
    };
  };
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isActive: boolean;
  };
}

// GET - Get all business units for the company
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    
    // For now, we'll use a default account ID - in production, get from auth token
    const accountId = searchParams.get('accountId') || '68b87f9a91ee971988573868';
    
    const businessUnits = db.collection('businessunits');
    const units = await businessUnits
      .find({ 
        accountId,
        'metadata.isActive': true 
      })
      .sort({ businessName: 1 })
      .toArray();
    
    // Also get available employees, regions, zones, etc. for assignment
    const employeeProfiles = db.collection('employeeprofiles');
    const employees = await employeeProfiles.find({}).toArray();
    
    // Extract unique values for dropdowns
    const availableOptions = {
      regions: [...new Set(employees.map(e => e.custom_attributes?.position_1).filter(Boolean))],
      zones: [...new Set(employees.map(e => e.custom_attributes?.position_2).filter(Boolean))],
      batches: [...new Set(employees.map(e => e.custom_attributes?.position_3).filter(Boolean))],
      branches: [...new Set(employees.map(e => e.custom_attributes?.position_4).filter(Boolean))],
      departments: [...new Set(employees.map(e => e.department).filter(Boolean))],
      jobTitles: [...new Set(employees.map(e => e.job_title).filter(Boolean))],
      employees: employees.map(e => ({
        id: e.user_id,
        name: `${e.first_name} ${e.last_name}`,
        employeeId: e.employeeId,
        department: e.department,
        region: e.custom_attributes?.position_1
      }))
    };
    
    return NextResponse.json({
      success: true,
      businessUnits: units,
      availableOptions,
      totalUnits: units.length
    });
    
  } catch (error) {
    console.error('Error fetching business units:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch business units', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Create new business unit
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const body = await request.json();
    
    const {
      accountId = '68b87f9a91ee971988573868', // Default for now
      businessName,
      businessCode,
      businessCategory,
      description,
      assignmentCriteria,
      businessDetails,
      createdBy = 'admin'
    } = body;
    
    // Validate required fields
    if (!businessName || !businessCode || !businessCategory) {
      return NextResponse.json(
        { error: 'Business name, code, and category are required' },
        { status: 400 }
      );
    }
    
    const businessUnits = db.collection('businessunits');
    
    // Check if business code already exists for this account
    const existingUnit = await businessUnits.findOne({
      accountId,
      businessCode,
      'metadata.isActive': true
    });
    
    if (existingUnit) {
      return NextResponse.json(
        { error: 'Business code already exists' },
        { status: 400 }
      );
    }
    
    // Create new business unit
    const newBusinessUnit: Omit<BusinessUnit, '_id'> = {
      accountId,
      businessName: businessName.trim(),
      businessCode: businessCode.toUpperCase().trim(),
      businessCategory: businessCategory.trim(),
      description: description?.trim(),
      assignmentCriteria: assignmentCriteria || {},
      businessDetails: businessDetails || {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        isActive: true
      }
    };
    
    const result = await businessUnits.insertOne(newBusinessUnit);
    
    // Trigger business assignment update for existing employees
    await updateEmployeeBusinessAssignments(db, accountId);
    
    return NextResponse.json({
      success: true,
      message: 'Business unit created successfully',
      businessUnitId: result.insertedId
    });
    
  } catch (error) {
    console.error('Error creating business unit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create business unit', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Update business unit
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const body = await request.json();
    
    const {
      businessUnitId,
      businessName,
      businessCategory,
      description,
      assignmentCriteria,
      businessDetails
    } = body;
    
    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit ID is required' },
        { status: 400 }
      );
    }
    
    const businessUnits = db.collection('businessunits');
    
    const updateData = {
      businessName: businessName?.trim(),
      businessCategory: businessCategory?.trim(),
      description: description?.trim(),
      assignmentCriteria,
      businessDetails,
      'metadata.updatedAt': new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    const result = await businessUnits.updateOne(
      { _id: new ObjectId(businessUnitId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      );
    }
    
    // Trigger business assignment update
    const unit = await businessUnits.findOne({ _id: new ObjectId(businessUnitId) });
    if (unit) {
      await updateEmployeeBusinessAssignments(db, unit.accountId);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Business unit updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating business unit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update business unit', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete business unit
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const businessUnitId = searchParams.get('businessUnitId');
    
    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit ID is required' },
        { status: 400 }
      );
    }
    
    const businessUnits = db.collection('businessunits');
    
    // Soft delete - mark as inactive
    const result = await businessUnits.updateOne(
      { _id: new ObjectId(businessUnitId) },
      { 
        $set: { 
          'metadata.isActive': false,
          'metadata.updatedAt': new Date()
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
      message: 'Business unit deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting business unit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete business unit', details: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to update employee business assignments
async function updateEmployeeBusinessAssignments(db: any, accountId: string) {
  try {
    // Get all active business units for this account
    const businessUnits = await db.collection('businessunits')
      .find({ accountId, 'metadata.isActive': true })
      .toArray();
    
    // Get all video upload activities
    const videoUploadActivities = db.collection('videouploadactivities');
    const activities = await videoUploadActivities.find({}).toArray();
    
    let updatedCount = 0;
    
    for (const activity of activities) {
      const employee = activity.employeeInfo;
      const org = activity.organizationInfo;
      
      // Find matching business unit
      let assignedBusiness = null;
      
      for (const unit of businessUnits) {
        const criteria = unit.assignmentCriteria;
        let matches = true;
        
        // Check specific employees first (highest priority)
        if (criteria.specificEmployees && criteria.specificEmployees.length > 0) {
          if (criteria.specificEmployees.includes(employee.employeeId)) {
            assignedBusiness = {
              businessName: unit.businessName,
              businessCode: unit.businessCode,
              category: unit.businessCategory,
              subCategory: unit.description
            };
            break;
          } else {
            continue; // Skip other criteria if specific employees are defined
          }
        }
        
        // Check region match
        if (criteria.regions && criteria.regions.length > 0) {
          if (!criteria.regions.includes(org.region)) matches = false;
        }
        
        // Check zone match
        if (criteria.zones && criteria.zones.length > 0) {
          if (!criteria.zones.includes(org.zone)) matches = false;
        }
        
        // Check batch match
        if (criteria.batches && criteria.batches.length > 0) {
          if (!criteria.batches.includes(org.batch)) matches = false;
        }
        
        // Check branch match
        if (criteria.branches && criteria.branches.length > 0) {
          if (!criteria.branches.includes(org.branch)) matches = false;
        }
        
        // Check department match
        if (criteria.departments && criteria.departments.length > 0) {
          if (!criteria.departments.includes(employee.department)) matches = false;
        }
        
        // Check job title match
        if (criteria.jobTitles && criteria.jobTitles.length > 0) {
          if (!criteria.jobTitles.includes(employee.jobTitle)) matches = false;
        }
        
        if (matches) {
          assignedBusiness = {
            businessName: unit.businessName,
            businessCode: unit.businessCode,
            category: unit.businessCategory,
            subCategory: unit.description
          };
          break;
        }
      }
      
      // Default business if no match
      if (!assignedBusiness) {
        assignedBusiness = {
          businessName: 'Unassigned Business',
          businessCode: 'UNASSIGNED',
          category: 'General',
          subCategory: 'Unassigned'
        };
      }
      
      // Update activity with business assignment
      await videoUploadActivities.updateOne(
        { _id: activity._id },
        {
          $set: {
            businessInfo: assignedBusiness,
            'metadata.updatedAt': new Date()
          }
        }
      );
      
      updatedCount++;
    }
    
    console.log(`Updated business assignments for ${updatedCount} activities`);
    return updatedCount;
    
  } catch (error) {
    console.error('Error updating employee business assignments:', error);
    throw error;
  }
}