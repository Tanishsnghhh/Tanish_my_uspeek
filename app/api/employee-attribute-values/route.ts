import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { EmployeeProfile, CustomAttributeDefinition, EmployeeAttributeValue } from '@/lib/models';
import mongoose from 'mongoose';

// GET - Fetch all attribute values for a specific employee or multiple employees
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const employeeIds = searchParams.get('employeeIds');
    
    if (!employeeId && !employeeIds) {
      return NextResponse.json(
        { error: 'Employee ID(s) is required' },
        { status: 400 }
      );
    }

    let employeeIdsArray: string[] = [];

    if (employeeIds) {
      // Handle multiple employee IDs (comma-separated)
      employeeIdsArray = employeeIds.split(',').map(id => id.trim()).filter(id => id);
    } else if (employeeId) {
      // Handle single employee ID
      employeeIdsArray = [employeeId];
    }

    // Validate all employee IDs
    for (const id of employeeIdsArray) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: `Invalid employee ID format: ${id}` },
          { status: 400 }
        );
      }
    }

    // Check if employees exist
    const employees = await EmployeeProfile!.find({
      _id: { $in: employeeIdsArray.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No employees found' },
        { status: 404 }
      );
    }

    const foundEmployeeIds = employees.map(emp => emp._id.toString());
    const missingIds = employeeIdsArray.filter(id => !foundEmployeeIds.includes(id));

    if (missingIds.length > 0) {
      console.warn(`Some employees not found: ${missingIds.join(', ')}`);
    }

    // Fetch all attribute values for the employees with populated attribute definitions
    const attributeValues = await EmployeeAttributeValue!.aggregate([
      {
        $match: {
          employee_id: { $in: foundEmployeeIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $lookup: {
          from: 'customattributedefinitions',
          localField: 'attribute_id',
          foreignField: '_id',
          as: 'attribute_definition'
        }
      },
      {
        $unwind: '$attribute_definition'
      },
      {
        $project: {
          _id: 1,
          employee_id: 1,
          attribute_id: 1,
          value: 1,
          created_at: 1,
          updated_at: 1,
          attribute_name: '$attribute_definition.name',
          attribute_position: '$attribute_definition.position'
        }
      },
      {
        $sort: {
          'employee_id': 1,
          'attribute_position': 1
        }
      }
    ]);

    // Group attributes by employee_id
    const attributesByEmployee: { [key: string]: any[] } = {};
    attributeValues.forEach(attr => {
      const empId = attr.employee_id.toString();
      if (!attributesByEmployee[empId]) {
        attributesByEmployee[empId] = [];
      }
      attributesByEmployee[empId].push(attr);
    });

    // Build response
    const response = {
      success: true,
      employees: foundEmployeeIds.map(employeeId => ({
        employee_id: employeeId,
        attribute_values: attributesByEmployee[employeeId] || []
      }))
    };

    // For backward compatibility with single employee requests
    if (employeeIdsArray.length === 1) {
      response.employees = response.employees[0] as any;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching employee attribute values:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update attribute values for an employee
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { employeeId, attributeValues } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(attributeValues)) {
      return NextResponse.json(
        { error: 'Attribute values must be an array' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await EmployeeProfile!.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];
    const customAttributesMap: { [key: string]: string } = {};

    // Process each attribute value
    for (const attrValue of attributeValues) {
      const { attributeId, value } = attrValue;

      if (!attributeId) {
        errors.push('Attribute ID is required for each value');
        continue;
      }

      if (!mongoose.Types.ObjectId.isValid(attributeId)) {
        errors.push(`Invalid attribute ID format: ${attributeId}`);
        continue;
      }

      try {
        // Check if attribute definition exists
        const attributeDefinition = await CustomAttributeDefinition!.findById(attributeId);
        if (!attributeDefinition || !attributeDefinition.is_active) {
          errors.push(`Attribute definition not found or inactive: ${attributeId}`);
          continue;
        }

        // Find existing value or create new one
        let employeeAttributeValue = await EmployeeAttributeValue!.findOne({
          employee_id: employeeId,
          attribute_id: attributeId
        });

        if (employeeAttributeValue) {
          // Update existing value
          employeeAttributeValue.value = value || '';
          await employeeAttributeValue.save();
          results.push({
            action: 'updated',
            employee_id: employeeId,
            attribute_id: attributeId,
            attribute_name: attributeDefinition.name,
            value: employeeAttributeValue.value,
            _id: employeeAttributeValue._id
          });
        } else {
          // Create new value
          employeeAttributeValue = await EmployeeAttributeValue!.create({
            employee_id: employeeId,
            attribute_id: attributeId,
            value: value || ''
          });
          results.push({
            action: 'created',
            employee_id: employeeId,
            attribute_id: attributeId,
            attribute_name: attributeDefinition.name,
            value: employeeAttributeValue.value,
            _id: employeeAttributeValue._id
          });
        }

        // Add to custom attributes map for profile update
        customAttributesMap[`position_${attributeDefinition.position}`] = value || '';

      } catch (error: any) {
        errors.push(`Error processing attribute ${attributeId}: ${error.message}`);
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
        errors.push(`Failed to update employee profile: ${profileError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} attribute values`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error updating employee attribute values:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a specific attribute value
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const valueId = searchParams.get('valueId');
    const employeeId = searchParams.get('employeeId');
    const attributeId = searchParams.get('attributeId');
    
    let deletedValue;
    let targetEmployeeId;
    let targetAttributeId;

    if (valueId) {
      // Delete by value ID
      if (!mongoose.Types.ObjectId.isValid(valueId)) {
        return NextResponse.json(
          { error: 'Invalid value ID format' },
          { status: 400 }
        );
      }

      deletedValue = await EmployeeAttributeValue!.findByIdAndDelete(valueId);
      if (!deletedValue) {
        return NextResponse.json(
          { error: 'Attribute value not found' },
          { status: 404 }
        );
      }
      targetEmployeeId = deletedValue.employee_id;
      targetAttributeId = deletedValue.attribute_id;
    } else if (employeeId && attributeId) {
      // Delete by employee ID and attribute ID
      if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(attributeId)) {
        return NextResponse.json(
          { error: 'Invalid employee ID or attribute ID format' },
          { status: 400 }
        );
      }

      deletedValue = await EmployeeAttributeValue!.findOneAndDelete({
        employee_id: employeeId,
        attribute_id: attributeId
      });

      if (!deletedValue) {
        return NextResponse.json(
          { error: 'Attribute value not found' },
          { status: 404 }
        );
      }
      targetEmployeeId = employeeId;
      targetAttributeId = attributeId;
    } else {
      return NextResponse.json(
        { error: 'Either valueId or both employeeId and attributeId are required' },
        { status: 400 }
      );
    }

    // Update the employee profile's custom_attributes field
    try {
      // Get the attribute definition to know the position
      const attributeDefinition = await CustomAttributeDefinition!.findById(targetAttributeId);
      if (attributeDefinition) {
        const positionKey = `position_${attributeDefinition.position}`;
        
        // Remove the specific position from custom_attributes
        await EmployeeProfile!.findByIdAndUpdate(
          targetEmployeeId,
          { 
            $unset: { [`custom_attributes.${positionKey}`]: 1 },
            $set: { updated_at: new Date() }
          },
          { new: true }
        );
        console.log(`Removed ${positionKey} from custom_attributes for employee ${targetEmployeeId}`);
      }
    } catch (profileError: any) {
      console.error(`Failed to update custom_attributes for employee ${targetEmployeeId}:`, profileError);
      // Don't return error here as the main operation succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'Attribute value deleted successfully',
      deleted_value: deletedValue
    });

  } catch (error) {
    console.error('Error deleting employee attribute value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
