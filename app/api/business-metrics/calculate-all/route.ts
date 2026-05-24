/**
 * Calculate All Business Metrics API Route
 * Handles batch calculation of business metrics for all business units
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { calculateBusinessMetrics } from '@/lib/services/business-metrics-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      periodType = 'all-time',
      forceRecalculate = false,
      accountId = 'default'
    } = body;

    const { db } = await connectDB();

    // Get all business units
    const businessUnits = await db.collection('businessunits').find({}).toArray();
    console.log(`Found ${businessUnits.length} business units for batch calculation`);

    const results = [];
    const errors = [];

    // Calculate metrics for each business unit
    for (const businessUnit of businessUnits) {
      try {
        console.log(`Calculating metrics for business unit: ${businessUnit.businessName} (${businessUnit.businessCode})`);

        const result = await calculateBusinessMetrics({
          businessName: businessUnit.businessName,
          businessCode: businessUnit.businessCode,
          businessCategory: businessUnit.category || 'General',
          periodType,
          accountId
        });

        if (result.success) {
          results.push({
            businessUnit: businessUnit.businessName,
            businessCode: businessUnit.businessCode,
            success: true,
            data: result
          });
        } else {
          errors.push({
            businessUnit: businessUnit.businessName,
            businessCode: businessUnit.businessCode,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`Error calculating metrics for ${businessUnit.businessName}:`, error);
        errors.push({
          businessUnit: businessUnit.businessName,
          businessCode: businessUnit.businessCode,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch calculation completed. ${results.length} successful, ${errors.length} errors`,
      results,
      errors,
      summary: {
        totalBusinessUnits: businessUnits.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error in batch business metrics calculation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to perform batch business metrics calculation', details: errorMessage },
      { status: 500 }
    );
  }
}
