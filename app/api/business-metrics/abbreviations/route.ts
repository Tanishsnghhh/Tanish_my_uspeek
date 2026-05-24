import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// Get business metrics using abbreviations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const abbreviations = searchParams.get('metrics')?.split(',') || [];
    const region = searchParams.get('region');
    const businessUnit = searchParams.get('businessUnit');
    
    if (abbreviations.length === 0) {
      return NextResponse.json({
        error: 'No metrics specified. Use ?metrics=ABL,AVT,AWP etc.'
      }, { status: 400 });
    }
    
    // Get dashboard data
    const dashboardResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/business-metrics/dashboard?region=${region || 'all'}`, {
      method: 'GET'
    });
    
    if (!dashboardResponse.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const dashboardData = await dashboardResponse.json();
    const metrics = dashboardData.data.aggregatedMetrics;
    
    // Map abbreviations to values
    const abbreviationMap: { [key: string]: { value: number; description: string } } = {
      // Participants
      'P': { value: metrics.totalParticipants, description: 'Participants' },
      
      // Body Language
      'ABL': { value: metrics.ABL, description: 'Average Body Language' },
      'MAX_BL': { value: metrics.MAX_BL, description: 'Maximum Body Language' },
      'MIN_BL': { value: metrics.MIN_BL, description: 'Minimum Body Language' },
      'BIR': { value: metrics.BIR, description: 'Body Language Improvement Rate' },
      'Avg_MIN_BL': { value: metrics.Avg_MIN_BL, description: 'Average Minimum Body Language' },
      'Avg_MAX_BL': { value: metrics.Avg_MAX_BL, description: 'Average Maximum Body Language' },
      
      // Vocal Tone
      'AVT': { value: metrics.AVT, description: 'Average Vocal Tone' },
      'MAX_VT': { value: metrics.MAX_VT, description: 'Maximum Vocal Tone' },
      'MIN_VT': { value: metrics.MIN_VT, description: 'Minimum Vocal Tone' },
      'VIR': { value: metrics.VIR, description: 'Vocal Tone Improvement Rate' },
      'Avg_MIN_VT': { value: metrics.Avg_MIN_VT, description: 'Average Minimum Vocal Tone' },
      'Avg_MAX_VT': { value: metrics.Avg_MAX_VT, description: 'Average Maximum Vocal Tone' },
      
      // Word Power
      'AWP': { value: metrics.AWP, description: 'Average Word Power' },
      'MAX_WP': { value: metrics.MAX_WP, description: 'Maximum Word Power' },
      'MIN_WP': { value: metrics.MIN_WP, description: 'Minimum Word Power' },
      'WIR': { value: metrics.WIR, description: 'Word Power Improvement Rate' },
      'Avg_MIN_WP': { value: metrics.Avg_MIN_WP, description: 'Average Minimum Word Power' },
      'Avg_MAX_WP': { value: metrics.Avg_MAX_WP, description: 'Average Maximum Word Power' },
      
      // Overall
      'Avg_OIR': { value: metrics.Avg_OIR, description: 'Average Overall Improvement Rate' },
      'Avg_MAX_OS': { value: metrics.Avg_MAX_OS, description: 'Average Maximum Overall Score' },
      'Avg_MIN_OS': { value: metrics.Avg_MIN_OS, description: 'Average Minimum Overall Score' },
      'Avg_BIR': { value: metrics.Avg_BIR, description: 'Average Body Language Improvement Rate' },
      'Avg_VIR': { value: metrics.Avg_VIR, description: 'Average Vocal Tone Improvement Rate' },
      'Avg_WIR': { value: metrics.Avg_WIR, description: 'Average Word Power Improvement Rate' }
    };
    
    // Build response with requested metrics
    const result: { [key: string]: any } = {};
    const notFound: string[] = [];
    
    abbreviations.forEach(abbr => {
      const trimmedAbbr = abbr.trim();
      if (abbreviationMap[trimmedAbbr]) {
        result[trimmedAbbr] = abbreviationMap[trimmedAbbr];
      } else {
        notFound.push(trimmedAbbr);
      }
    });
    
    return NextResponse.json({
      success: true,
      region: region || 'all',
      requestedMetrics: abbreviations,
      metrics: result,
      notFound: notFound.length > 0 ? notFound : undefined,
      availableAbbreviations: Object.keys(abbreviationMap),
      regionBreakdown: dashboardData.data.regionBreakdown,
      lastCalculated: dashboardData.data.lastCalculated
    });
    
  } catch (error) {
    console.error('Error fetching metrics by abbreviations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: errorMessage },
      { status: 500 }
    );
  }
}