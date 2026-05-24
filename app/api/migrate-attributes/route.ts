import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { EmployeeProfile, CustomAttributeDefinition, EmployeeAttributeValue } from '@/lib/models';
import mongoose from 'mongoose';

// POST - Migrate existing custom attributes to EmployeeAttributeValue model
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { dryRun = true } = body;

    const results = {
      processedEmployees: 0,
      migratedValues: 0,
      errors: [] as string[],
      dryRunMode: dryRun
    };

    // Get all employees with custom attributes
    const employees = await EmployeeProfile!.find({
      custom_attributes: { $exists: true, $ne: {} }
    });

    console.log(`Found ${employees.length} employees with custom attributes`);

    for (const employee of employees) {
      try {
        results.processedEmployees++;
        
        if (!employee.custom_attributes || Object.keys(employee.custom_attributes).length === 0) {
          continue;
        }

        // Get the corporate account ID from the employee's user
        const userLookup = await mongoose.model('User').findById(employee.user_id);
        if (!userLookup) {
          results.errors.push(`User not found for employee ${employee._id}`);
          continue;
        }

        const accountId = userLookup.account_id;
        
        // Get all custom attribute definitions for this account
        const attributeDefinitions = await CustomAttributeDefinition!.find({
          account_id: accountId,
          is_active: true
        });

        if (attributeDefinitions.length === 0) {
          results.errors.push(`No attribute definitions found for account ${accountId}`);
          continue;
        }

        // Process each custom attribute
        for (const [key, value] of Object.entries(employee.custom_attributes)) {
          if (!value || typeof value !== 'string') continue;

          // Extract position from key (e.g., "position_1" -> 1)
          const positionMatch = key.match(/position_(\d+)/);
          if (!positionMatch) continue;

          const position = parseInt(positionMatch[1]);
          
          // Find the corresponding attribute definition
          const attributeDefinition = attributeDefinitions.find(
            def => def.position === position
          );

          if (!attributeDefinition) {
            results.errors.push(
              `No attribute definition found for position ${position} in account ${accountId}`
            );
            continue;
          }

          // Check if EmployeeAttributeValue already exists
          const existingValue = await EmployeeAttributeValue!.findOne({
            employee_id: employee._id,
            attribute_id: attributeDefinition._id
          });

          if (existingValue) {
            console.log(`Value already exists for employee ${employee._id}, attribute ${attributeDefinition._id}`);
            continue;
          }

          if (!dryRun) {
            // Create new EmployeeAttributeValue record
            await EmployeeAttributeValue!.create({
              employee_id: employee._id,
              attribute_id: attributeDefinition._id,
              value: value.trim()
            });
          }

          results.migratedValues++;
          console.log(
            `${dryRun ? '[DRY RUN] ' : ''}Migrated: Employee ${employee._id} -> ${attributeDefinition.name} = "${value}"`
          );
        }

      } catch (error: any) {
        results.errors.push(`Error processing employee ${employee._id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed. ${results.migratedValues} values would be migrated.`
        : `Migration completed. ${results.migratedValues} values migrated.`,
      results
    });

  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    );
  }
}

// GET - Get migration status and statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Count employees with old-style custom attributes
    const employeesWithOldAttributes = await EmployeeProfile!.countDocuments({
      custom_attributes: { $exists: true, $ne: {} }
    });

    // Count new-style attribute values
    const newAttributeValues = await EmployeeAttributeValue!.countDocuments();

    // Get total employees
    const totalEmployees = await EmployeeProfile!.countDocuments({ isActive: true });

    // Get total active attribute definitions
    const totalAttributeDefinitions = await CustomAttributeDefinition!.countDocuments({ is_active: true });

    return NextResponse.json({
      success: true,
      statistics: {
        totalEmployees,
        employeesWithOldAttributes,
        newAttributeValues,
        totalAttributeDefinitions,
        migrationNeeded: employeesWithOldAttributes > 0
      }
    });

  } catch (error) {
    console.error('Error getting migration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
