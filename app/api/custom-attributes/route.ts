import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CustomAttributeDefinition from '@/lib/models/CustomAttributeDefinition';
import mongoose from 'mongoose';
import { cleanAndValidateAccountId } from '@/lib/account-id-utils';

// GET - Fetch custom attribute definitions for an account
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const rawAccountId = searchParams.get('accountId');
    
    try {
      const accountId = cleanAndValidateAccountId(decodeURIComponent(rawAccountId || ''));
      
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return NextResponse.json(
          { error: 'Invalid ObjectId format' },
          { status: 400 }
        );
      }

      const definitions = await CustomAttributeDefinition!.getByAccount(
        new mongoose.Types.ObjectId(accountId)
      );

      return NextResponse.json({
        success: true,
        definitions
      });

    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid account ID' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error fetching custom attribute definitions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update custom attribute definitions
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    let { accountId: rawAccountId, attributes } = body;

    try {
      const accountId = cleanAndValidateAccountId(rawAccountId);
      
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return NextResponse.json(
          { error: 'Invalid ObjectId format' },
          { status: 400 }
        );
      }

      if (!Array.isArray(attributes) || attributes.length === 0) {
        return NextResponse.json(
          { error: 'Attributes array is required' },
          { status: 400 }
        );
      }

      if (attributes.length > 3) {
        return NextResponse.json(
          { error: 'Maximum of 3 custom attributes allowed' },
          { status: 400 }
        );
      }

      const accountObjectId = new mongoose.Types.ObjectId(accountId);
      const results = [];

      // Create or update each attribute definition
      for (const attr of attributes) {
        if (!attr.position || !attr.name || ![1, 2, 3, 4].includes(attr.position)) {
          return NextResponse.json(
            { error: 'Each attribute must have a valid position (1, 2, 3, or 4) and name' },
            { status: 400 }
          );
        }

        try {
          const result = await CustomAttributeDefinition!.createOrUpdate(
            accountObjectId,
            attr.position,
            attr.name.trim()
          );
          results.push(result);
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Custom attributes updated successfully',
        definitions: results
      });

    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid account ID' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating/updating custom attribute definitions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
