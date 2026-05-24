import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// POST - Trigger business assignment update for all employees
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const body = await request.json();
    
    const { accountId = '68b87f9a91ee971988573868' } = body;
    
    // Get all active business units for this account
    const businessUnits = await db.collection('businessunits')
      .find({ accountId, 'metadata.isActive': true })
      .toArray();
    
    console.log(`Found ${businessUnits.length} active business units`);
    
    // Get all video upload activities
    const videoUploadActivities = db.collection('videouploadactivities');
    const activities = await videoUploadActivities.find({}).toArray();
    
    console.log(`Processing ${activities.length} activities`);
    
    let updatedCount = 0;
    let assignmentResults: { [businessCode: string]: number } = {};
    
    for (const activity of activities) {
      const employee = activity.employeeInfo;
      const org = activity.organizationInfo;
      
      // Find matching business unit
      let assignedBusiness = null;
      let matchReason = '';
      
      for (const unit of businessUnits) {
        const criteria = unit.assignmentCriteria;
        let matches = true;
        let matchDetails: string[] = [];
        
        // Check specific employees first (highest priority)
        if (criteria.specificEmployees && criteria.specificEmployees.length > 0) {
          if (criteria.specificEmployees.includes(employee.employeeId)) {
            assignedBusiness = {
              businessName: unit.businessName,
              businessCode: unit.businessCode,
              category: unit.businessCategory,
              subCategory: unit.description
            };
            matchReason = 'Specific Employee Assignment';
            break;
          } else {
            continue; // Skip other criteria if specific employees are defined but don't match
          }
        }
        
        // Check region match
        if (criteria.regions && criteria.regions.length > 0) {
          if (criteria.regions.includes(org.region)) {
            matchDetails.push(`Region: ${org.region}`);
          } else {
            matches = false;
          }
        }
        
        // Check zone match
        if (criteria.zones && criteria.zones.length > 0) {
          if (criteria.zones.includes(org.zone)) {
            matchDetails.push(`Zone: ${org.zone}`);
          } else {
            matches = false;
          }
        }
        
        // Check batch match
        if (criteria.batches && criteria.batches.length > 0) {
          if (criteria.batches.includes(org.batch)) {
            matchDetails.push(`Batch: ${org.batch}`);
          } else {
            matches = false;
          }
        }
        
        // Check branch match
        if (criteria.branches && criteria.branches.length > 0) {
          if (criteria.branches.includes(org.branch)) {
            matchDetails.push(`Branch: ${org.branch}`);
          } else {
            matches = false;
          }
        }
        
        // Check department match
        if (criteria.departments && criteria.departments.length > 0) {
          if (criteria.departments.includes(employee.department)) {
            matchDetails.push(`Department: ${employee.department}`);
          } else {
            matches = false;
          }
        }
        
        // Check job title match
        if (criteria.jobTitles && criteria.jobTitles.length > 0) {
          if (criteria.jobTitles.includes(employee.jobTitle)) {
            matchDetails.push(`Job Title: ${employee.jobTitle}`);
          } else {
            matches = false;
          }
        }
        
        if (matches && matchDetails.length > 0) {
          assignedBusiness = {
            businessName: unit.businessName,
            businessCode: unit.businessCode,
            category: unit.businessCategory,
            subCategory: unit.description
          };
          matchReason = matchDetails.join(', ');
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
        matchReason = 'Default Assignment (No Criteria Match)';
      }
      
      // Update activity with business assignment
      await videoUploadActivities.updateOne(
        { _id: activity._id },
        {
          $set: {
            businessInfo: assignedBusiness,
            'metadata.updatedAt': new Date(),
            'metadata.businessAssignmentReason': matchReason
          }
        }
      );
      
      // Track assignment results
      const businessCode = assignedBusiness.businessCode;
      assignmentResults[businessCode] = (assignmentResults[businessCode] || 0) + 1;
      updatedCount++;
    }
    
    console.log(`Updated business assignments for ${updatedCount} activities`);
    console.log('Assignment results:', assignmentResults);
    
    return NextResponse.json({
      success: true,
      message: 'Business assignments updated successfully',
      summary: {
        totalActivities: activities.length,
        updatedCount,
        businessUnitsUsed: businessUnits.length,
        assignmentResults
      }
    });
    
  } catch (error) {
    console.error('Error updating business assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update business assignments', details: errorMessage },
      { status: 500 }
    );
  }
}