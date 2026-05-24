import { NextRequest, NextResponse } from 'next/server';
import { calculateBusinessWiseData } from '../../../lib/services/business-wise-data-calculator';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const periodStart = searchParams.get('periodStart') ? new Date(searchParams.get('periodStart')!) : undefined;
        const periodEnd = searchParams.get('periodEnd') ? new Date(searchParams.get('periodEnd')!) : undefined;
        const region = searchParams.get('region') || undefined;
        const zone = searchParams.get('zone') || undefined;
        const batch = searchParams.get('batch') || undefined;
        const branch = searchParams.get('branch') || undefined;
        const businessCode = searchParams.get('businessCode') || undefined;

        const result = await calculateBusinessWiseData({
            periodStart,
            periodEnd,
            region,
            zone,
            batch,
            branch,
            businessCode
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: 400 }
            );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in business-wise-data API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            periodStart,
            periodEnd,
            region,
            zone,
            batch,
            branch,
            businessCode
        } = body;

        const result = await calculateBusinessWiseData({
            periodStart: periodStart ? new Date(periodStart) : undefined,
            periodEnd: periodEnd ? new Date(periodEnd) : undefined,
            region,
            zone,
            batch,
            branch,
            businessCode
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: 400 }
            );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in business-wise-data API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
