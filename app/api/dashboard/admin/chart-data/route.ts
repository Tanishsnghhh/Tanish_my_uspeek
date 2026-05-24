import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectDB();
    const businessMetrics = db.collection('businessmetrics');

    // Get all active business metrics
    const metrics = await businessMetrics.find({ 'metadata.isActive': true }).toArray();

    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          businessUnits: [],
          regions: []
        }
      });
    }

    // Format business units data for chart
    const businessUnits = metrics.map(metric => ({
      name: metric.businessName,
      region: metric.region,
      improvementRate: metric.overall?.avgOverallImprovementRate || 0,
      participants: metric.participants?.totalParticipants || 0
    })).sort((a, b) => b.improvementRate - a.improvementRate);

    // Group by region for region chart
    const regionMap: { [key: string]: any } = {};
    metrics.forEach(metric => {
      const region = metric.region;
      if (!regionMap[region]) {
        regionMap[region] = {
          region,
          totalImprovement: 0,
          totalParticipants: 0,
          businessUnits: []
        };
      }

      const participants = metric.participants?.totalParticipants || 0;
      const improvement = metric.overall?.avgOverallImprovementRate || 0;

      regionMap[region].totalImprovement += improvement * participants;
      regionMap[region].totalParticipants += participants;
      regionMap[region].businessUnits.push({
        name: metric.businessName,
        improvementRate: improvement,
        participants
      });
    });

    const regions = Object.values(regionMap).map((region: any) => ({
      region: region.region,
      avgOverallImprovement: region.totalParticipants > 0 ?
        Math.round((region.totalImprovement / region.totalParticipants) * 100) / 100 : 0,
      businessUnits: region.businessUnits.length,
      participants: region.totalParticipants
    })).sort((a: any, b: any) => b.avgOverallImprovement - a.avgOverallImprovement);

    return NextResponse.json({
      success: true,
      data: {
        businessUnits,
        regions
      }
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
