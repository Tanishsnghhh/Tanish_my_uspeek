import { NextRequest, NextResponse } from 'next/server';
import { CustomAttributeDefinition } from '@/lib/models';
import connectDB from '@/lib/database';
import jwt from 'jsonwebtoken';

// GET /api/reports/definitions/attributes - Get custom attributes for an account
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Extract account_id from JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let accountId: string;
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded?.corporateAccountId) {
        return NextResponse.json(
          { success: false, error: 'Invalid token: missing account ID' },
          { status: 401 }
        );
      }
      accountId = decoded.corporateAccountId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch custom attributes from all accounts for dynamic access
    // Group by position to handle multiple accounts with different attribute names
    const allAttributes = await CustomAttributeDefinition!.find({
      is_active: true
    })
    .sort({ position: 1, account_id: 1 })
    .select('_id position name account_id')
    .lean();

    // Group attributes by position to create combined attribute definitions
    const attributesByPosition: Record<number, {
      position: number;
      names: Set<string>;
      firstId: any;
      accounts: Set<string>;
    }> = {};
    
    allAttributes.forEach(attr => {
      if (!attributesByPosition[attr.position]) {
        attributesByPosition[attr.position] = {
          position: attr.position,
          names: new Set(),
          firstId: attr._id,
          accounts: new Set()
        };
      }
      attributesByPosition[attr.position].names.add(attr.name);
      attributesByPosition[attr.position].accounts.add(attr.account_id.toString());
    });

    // Enforce canonical business terms for positions 1..4. Do not return any implicit/fallback names.
    const CANONICAL_BY_POSITION: Record<number, string> = {
      1: 'Division',
      2: 'Region',
      3: 'Level',
      4: 'Branch'
    };

    function chooseCanonicalName(namesSet: Set<string>, position: number): string | null {
      if (!namesSet || namesSet.size === 0) return null;
      const canonical = CANONICAL_BY_POSITION[position];
      if (!canonical) return null; // position out of scope

      const names = Array.from(namesSet).map(n => (n || '').trim()).filter(Boolean);

      // 1) Exact match (case-insensitive)
      for (const n of names) {
        if (n.toLowerCase() === canonical.toLowerCase()) return n;
      }

      // 2) Check parts of any joined names like "A / B" for the canonical term
      for (const n of names) {
        const parts = n.split('/').map(p => p.trim()).filter(Boolean);
        for (const p of parts) {
          if (p.toLowerCase() === canonical.toLowerCase()) return p;
        }
      }

      // No fallback — signal missing canonical
      return null;
    }

    // Build attribute list but enforce presence of canonical names only
    const missingPositions: number[] = [];
    const attributes = Object.values(attributesByPosition).map((group: any) => {
      const name = chooseCanonicalName(group.names, group.position);
      if (!name) missingPositions.push(group.position);
      return {
        _id: group.firstId,
        position: group.position,
        name
      };
    });

    if (missingPositions.length) {
      // Return explicit error rather than providing fallback values
      return NextResponse.json(
        {
          success: false,
          error: `Missing canonical attribute definitions for positions: ${[...new Set(missingPositions)].sort().join(', ')}`
        },
        { status: 422 }
      );
    }

    // Format response according to API spec
    const formattedAttributes = attributes.map(attr => ({
      position: `position${attr.position}`,
      attributeId: attr._id.toString(),
      name: attr.name
    }));

    return NextResponse.json({
      success: true,
      attributes: formattedAttributes
    });

  } catch (error) {
    console.error('Error fetching attribute definitions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
