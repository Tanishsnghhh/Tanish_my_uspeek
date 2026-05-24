import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import EmployeeAttributeValue from '@/lib/models/EmployeeAttributeValue';
import CustomAttributeDefinition from '@/lib/models/CustomAttributeDefinition';
import EmployeeProfile from '@/lib/models/EmployeeProfile';
import mongoose from 'mongoose';
import { cleanAndValidateAccountId } from '@/lib/account-id-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { updates, accountId: rawAccountId } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    if (!rawAccountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Validate and clean account ID
    let accountId: string;
    try {
      accountId = cleanAndValidateAccountId(rawAccountId);
      console.log(`Cleaned accountId: ${accountId}`);
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return NextResponse.json(
          { error: 'Invalid ObjectId format for account ID' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid account ID' },
        { status: 400 }
      );
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    console.log(`Account ObjectId: ${accountObjectId}`);
    const results: any[] = [];
    const errors: any[] = [];

    // First, collect all unique positions that need definitions
    const positionsToCreate = new Set<number>();
    for (const update of updates) {
      const { attributes } = update;
      console.log(`Processing update for employee ${update.employeeId}, attributes:`, attributes);
      if (attributes && typeof attributes === 'object') {
        for (const [key, value] of Object.entries(attributes)) {
          if (typeof value === 'string') {
            const position = parseInt(key.replace('position_', ''));
            console.log(`Found attribute ${key} -> position ${position}, value: ${value}`);
            if (!isNaN(position) && position >= 1 && position <= 4) {
              positionsToCreate.add(position);
            }
          }
        }
      }
    }

    // Create/update definitions for all positions that will be used
    const defaultNames = {
      1: 'Region',
      2: 'Zone', 
      3: 'Batch',
      4: 'Branch'
    };

    console.log(`Positions to create: ${Array.from(positionsToCreate)}`);

    for (const position of Array.from(positionsToCreate)) {
      try {
        const defaultName = defaultNames[position as keyof typeof defaultNames] || `Position ${position}`;
        await CustomAttributeDefinition!.createOrUpdate(
          accountObjectId,
          position,
          defaultName
        );
        console.log(`Successfully created/updated definition for position ${position}`);
      } catch (defError: any) {
        console.error(`Failed to create/update definition for position ${position}:`, defError);
        // Continue processing other positions even if one fails
      }
    }

    // Now process employee updates
    for (const update of updates) {
      const { employeeId, attributes } = update;

      if (!employeeId || !attributes || typeof attributes !== 'object') {
        errors.push({ employeeId, error: 'Invalid employeeId or attributes' });
        continue;
      }

      try {
        const customAttributesMap: { [key: string]: string } = {};

        // Update each attribute for the employee
        for (const [key, value] of Object.entries(attributes)) {
          if (value && typeof value === 'string') {
            const position = parseInt(key.replace('position_', ''));
            if (!isNaN(position) && position >= 1 && position <= 4) {
              // Find the attribute definition for this position
              const attrDef = await CustomAttributeDefinition!.findOne({
                account_id: accountObjectId,
                position,
                is_active: true
              });

              if (attrDef) {
                // Try to find existing value
                let attrValue = await EmployeeAttributeValue!.findOne({
                  employee_id: employeeId,
                  attribute_id: attrDef._id
                });

                if (attrValue) {
                  // Update existing
                  attrValue.value = value.trim();
                  await attrValue.save();
                } else {
                  // Create new
                  attrValue = new EmployeeAttributeValue({
                    employee_id: employeeId,
                    attribute_id: attrDef._id,
                    value: value.trim()
                  });
                  await attrValue.save();
                }

                // Add to custom attributes map for profile update
                customAttributesMap[`position_${position}`] = value.trim();
              } else {
                console.error(`Could not find attribute definition for position ${position}`);
              }
            }
          }
        }

        // Update the employee profile's custom_attributes field
        if (Object.keys(customAttributesMap).length > 0) {
          try {
            await EmployeeProfile!.findByIdAndUpdate(
              employeeId,
              { 
                $set: { 
                  custom_attributes: customAttributesMap,
                  updated_at: new Date()
                } 
              },
              { new: true }
            );
            console.log(`Updated custom_attributes for employee ${employeeId}`);
          } catch (profileError: any) {
            console.error(`Failed to update custom_attributes for employee ${employeeId}:`, profileError);
            // Continue with other employees even if one fails
          }
        }

        results.push({ employeeId, status: 'success' });
      } catch (error: any) {
        console.error(`Error updating employee ${employeeId}:`, error);
        errors.push({ employeeId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} employees, ${errors.length} errors`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
