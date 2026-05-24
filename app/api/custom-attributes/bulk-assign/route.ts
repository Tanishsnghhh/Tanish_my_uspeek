import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import connectDB from '@/lib/database';
import EmployeeProfile from '@/lib/models/EmployeeProfile';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeIds, attributeValues } = body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No employeeIds provided' }, { status: 400 });
    }

    if (!Array.isArray(attributeValues) || attributeValues.length === 0) {
      return NextResponse.json({ success: false, error: 'No attributeValues provided' }, { status: 400 });
    }

    // Connect to MongoDB for Mongoose operations
    await connectDB();
    
    const db = await getDatabase();
    // Use the correct collection name that matches the Mongoose model
    const coll = db.collection('employeeattributevalues');

    const bulkOps: any[] = [];

    // Prepare custom attributes map for employee profiles
    const customAttributesMap: { [key: string]: string } = {};
    for (const attr of attributeValues) {
      const pos = Number(attr.attribute_position);
      if (!Number.isNaN(pos) && pos >= 1 && pos <= 4) {
        customAttributesMap[`position_${pos}`] = attr.value || '';
      }
    }

    for (const empId of employeeIds) {
      for (const attr of attributeValues) {
        const pos = Number(attr.attribute_position);
        if (Number.isNaN(pos) || pos < 1 || pos > 4) continue;

        const filter = { employee_id: empId, attribute_position: pos };
        const update = { $set: { value: attr.value || '', attribute_position: pos, updatedAt: new Date() } };
        bulkOps.push({ updateOne: { filter, update, upsert: true } });
      }

      // Update the employee profile's custom_attributes field
      try {
        await EmployeeProfile!.findByIdAndUpdate(
          empId,
          { 
            $set: { 
              custom_attributes: customAttributesMap,
              updated_at: new Date()
            } 
          },
          { new: true }
        );
        console.log(`Updated custom_attributes for employee ${empId}`);
      } catch (profileError: any) {
        console.error(`Failed to update custom_attributes for employee ${empId}:`, profileError);
        // Continue with other employees even if one fails
      }
    }

    if (bulkOps.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid attribute operations to perform' }, { status: 400 });
    }

    const result = await coll.bulkWrite(bulkOps, { ordered: false });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('bulk-assign-attributes error', err);
    return NextResponse.json({ success: false, error: String(err?.message || err) }, { status: 500 });
  }
}
