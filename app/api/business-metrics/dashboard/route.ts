import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// Get aggregated business metrics for dashboard
export async function GET(request: Request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    
    const region = searchParams.get('region');
    const periodType = searchParams.get('periodType') || 'all-time';
    const year = searchParams.get('year');
    
    const businessMetrics = db.collection('businessmetrics');
    
    // Build filter
    const filter: any = { 'metadata.isActive': true };
    if (region && region !== 'all') filter.region = region;
    if (periodType) filter['periodInfo.periodType'] = periodType;
    if (year) filter['periodInfo.year'] = parseInt(year);
    
    // Get all metrics matching the filter
    const metrics = await businessMetrics.find(filter).toArray();
    
    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No metrics found for the specified criteria',
        data: {
          summary: {
            totalBusinessUnits: 0,
            totalParticipants: 0,
            totalVideos: 0,
            totalAnalyzedVideos: 0,
            overallAnalysisRate: 0
          },
          aggregatedMetrics: {},
          regionBreakdown: [],
          topPerformers: {
            bodyLanguage: [],
            vocalTone: [],
            wordPower: [],
            overall: []
          }
        }
      });
    }
    
    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(metrics);
    
    // Calculate region breakdown
    const regionBreakdown = calculateRegionBreakdown(metrics);
    
    // Find top performers
    const topPerformers = findTopPerformers(metrics);
    
    // Calculate summary
    const summary = {
      totalBusinessUnits: metrics.length,
      totalParticipants: metrics.reduce((sum, m) => sum + m.participants.totalParticipants, 0),
      totalVideos: metrics.reduce((sum, m) => sum + m.participants.totalVideos, 0),
      totalAnalyzedVideos: metrics.reduce((sum, m) => sum + m.participants.analyzedVideos, 0),
      overallAnalysisRate: Math.round(
        (metrics.reduce((sum, m) => sum + m.participants.analyzedVideos, 0) /
         Math.max(metrics.reduce((sum, m) => sum + m.participants.totalVideos, 0), 1)) * 100
      )
    };
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        aggregatedMetrics,
        regionBreakdown,
        topPerformers,
        lastCalculated: metrics.length > 0 ? 
          Math.max(...metrics.map(m => new Date(m.metadata.calculatedAt).getTime())) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics', details: errorMessage },
      { status: 500 }
    );
  }
}

// Calculate aggregated metrics across all business units
function calculateAggregatedMetrics(metrics: any[]) {
  const totalParticipants = metrics.reduce((sum, m) => sum + m.participants.totalParticipants, 0);
  
  // Helper function to calculate weighted average
  const weightedAvg = (field: string, subField: string) => {
    const totalValue = metrics.reduce((sum, m) => {
      const participants = m.participants.totalParticipants;
      const value = m[field][subField] || 0;
      return sum + (value * participants);
    }, 0);
    return totalParticipants > 0 ? Math.round((totalValue / totalParticipants) * 100) / 100 : 0;
  };
  
  return {
    // Participants (P)
    totalParticipants,
    
    // Body Language Metrics
    ABL: weightedAvg('bodyLanguage', 'averageBodyLanguage'),
    MAX_BL: Math.max(...metrics.map(m => m.bodyLanguage.maximumBodyLanguage || 0)),
    MIN_BL: Math.min(...metrics.map(m => m.bodyLanguage.minimumBodyLanguage || 100)),
    BIR: weightedAvg('bodyLanguage', 'bodyLanguageImprovementRate'),
    Avg_MIN_BL: weightedAvg('bodyLanguage', 'avgMinBodyLanguage'),
    Avg_MAX_BL: weightedAvg('bodyLanguage', 'avgMaxBodyLanguage'),
    
    // Vocal Tone Metrics
    AVT: weightedAvg('vocalTone', 'averageVocalTone'),
    MAX_VT: Math.max(...metrics.map(m => m.vocalTone.maximumVocalTone || 0)),
    MIN_VT: Math.min(...metrics.map(m => m.vocalTone.minimumVocalTone || 100)),
    VIR: weightedAvg('vocalTone', 'vocalToneImprovementRate'),
    Avg_MIN_VT: weightedAvg('vocalTone', 'avgMinVocalTone'),
    Avg_MAX_VT: weightedAvg('vocalTone', 'avgMaxVocalTone'),
    
    // Word Power Metrics
    AWP: weightedAvg('wordPower', 'averageWordPower'),
    MAX_WP: Math.max(...metrics.map(m => m.wordPower.maximumWordPower || 0)),
    MIN_WP: Math.min(...metrics.map(m => m.wordPower.minimumWordPower || 100)),
    WIR: weightedAvg('wordPower', 'wordPowerImprovementRate'),
    Avg_MIN_WP: weightedAvg('wordPower', 'avgMinWordPower'),
    Avg_MAX_WP: weightedAvg('wordPower', 'avgMaxWordPower'),
    
    // Overall Metrics
    Avg_OIR: weightedAvg('overall', 'avgOverallImprovementRate'),
    Avg_MAX_OS: weightedAvg('overall', 'avgMaxOverallScore'),
    Avg_MIN_OS: weightedAvg('overall', 'avgMinOverallScore'),
    Avg_BIR: weightedAvg('overall', 'avgBodyLanguageImprovementRate'),
    Avg_VIR: weightedAvg('overall', 'avgVocalToneImprovementRate'),
    Avg_WIR: weightedAvg('overall', 'avgWordPowerImprovementRate')
  };
}

// Calculate breakdown by region
function calculateRegionBreakdown(metrics: any[]) {
  const regionMap: { [region: string]: any } = {};
  
  metrics.forEach(metric => {
    const region = metric.region;
    if (!regionMap[region]) {
      regionMap[region] = {
        region,
        businessUnits: 0,
        participants: 0,
        videos: 0,
        analyzedVideos: 0,
        avgBodyLanguage: 0,
        avgVocalTone: 0,
        avgWordPower: 0,
        avgOverallImprovement: 0,
        totalParticipants: 0
      };
    }
    
    const regionData = regionMap[region];
    const participants = metric.participants.totalParticipants;
    
    regionData.businessUnits += 1;
    regionData.participants += participants;
    regionData.videos += metric.participants.totalVideos;
    regionData.analyzedVideos += metric.participants.analyzedVideos;
    regionData.totalParticipants += participants;
    
    // Weighted averages
    regionData.avgBodyLanguage += (metric.bodyLanguage.averageBodyLanguage || 0) * participants;
    regionData.avgVocalTone += (metric.vocalTone.averageVocalTone || 0) * participants;
    regionData.avgWordPower += (metric.wordPower.averageWordPower || 0) * participants;
    regionData.avgOverallImprovement += (metric.overall.avgOverallImprovementRate || 0) * participants;
  });
  
  // Calculate final averages
  return Object.values(regionMap).map((region: any) => ({
    ...region,
    avgBodyLanguage: region.totalParticipants > 0 ? 
      Math.round((region.avgBodyLanguage / region.totalParticipants) * 100) / 100 : 0,
    avgVocalTone: region.totalParticipants > 0 ? 
      Math.round((region.avgVocalTone / region.totalParticipants) * 100) / 100 : 0,
    avgWordPower: region.totalParticipants > 0 ? 
      Math.round((region.avgWordPower / region.totalParticipants) * 100) / 100 : 0,
    avgOverallImprovement: region.totalParticipants > 0 ? 
      Math.round((region.avgOverallImprovement / region.totalParticipants) * 100) / 100 : 0,
    analysisRate: region.videos > 0 ? 
      Math.round((region.analyzedVideos / region.videos) * 100) : 0
  })).sort((a, b) => b.avgOverallImprovement - a.avgOverallImprovement);
}

// Find top performing business units
function findTopPerformers(metrics: any[]) {
  const sortedByBL = [...metrics].sort((a, b) => 
    (b.bodyLanguage.averageBodyLanguage || 0) - (a.bodyLanguage.averageBodyLanguage || 0)
  ).slice(0, 5);
  
  const sortedByVT = [...metrics].sort((a, b) => 
    (b.vocalTone.averageVocalTone || 0) - (a.vocalTone.averageVocalTone || 0)
  ).slice(0, 5);
  
  const sortedByWP = [...metrics].sort((a, b) => 
    (b.wordPower.averageWordPower || 0) - (a.wordPower.averageWordPower || 0)
  ).slice(0, 5);
  
  const sortedByOverall = [...metrics].sort((a, b) => 
    (b.overall.avgOverallImprovementRate || 0) - (a.overall.avgOverallImprovementRate || 0)
  ).slice(0, 5);
  
  return {
    bodyLanguage: sortedByBL.map(m => ({
      businessName: m.businessName,
      region: m.region,
      score: m.bodyLanguage.averageBodyLanguage,
      participants: m.participants.totalParticipants
    })),
    vocalTone: sortedByVT.map(m => ({
      businessName: m.businessName,
      region: m.region,
      score: m.vocalTone.averageVocalTone,
      participants: m.participants.totalParticipants
    })),
    wordPower: sortedByWP.map(m => ({
      businessName: m.businessName,
      region: m.region,
      score: m.wordPower.averageWordPower,
      participants: m.participants.totalParticipants
    })),
    overall: sortedByOverall.map(m => ({
      businessName: m.businessName,
      region: m.region,
      score: m.overall.avgOverallImprovementRate,
      participants: m.participants.totalParticipants
    }))
  };
}