import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';
import { ObjectId } from 'mongodb';

interface WeeklyData {
  week: number;
  weekLabel: string;
  dateRange: string;
  totalVideos: number;
  weeklyIncrease: number;
  regionBreakdown: {
    [region: string]: number;
  };
}

interface BasecampStatusResponse {
  weeklyData: WeeklyData[];
  regionTotals: {
    [region: string]: number[];
  };
  weeklyIncreases: {
    labels: string[];
    data: number[];
  };
  summary: {
    totalVideos: number;
    totalEmployees: number;
    activeRegions: string[];
    latestWeekIncrease: number;
    totalAnalyzedVideos: number;
    analysisRate: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication and get corporate account ID
    const authResult = await checkAdminPermissions(request);
    
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return NextResponse.json(
        { error: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    if (!authResult.corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    
    const videoUploadActivities = db.collection('videouploadactivities');
    
    // Get video upload activities for this corporate account only
    const allActivities = await videoUploadActivities.find({
      corporate_account_id: new ObjectId(authResult.corporateAccountId)
    })
      .sort({ uploadDate: 1 })
      .toArray();
    
    console.log(`Found ${allActivities.length} video upload activities`);
    
    if (allActivities.length === 0) {
      return NextResponse.json({
        weeklyData: [],
        regionTotals: {},
        weeklyIncreases: { labels: [], data: [] },
        summary: {
          totalVideos: 0,
          totalEmployees: 0,
          activeRegions: [],
          latestWeekIncrease: 0,
          totalAnalyzedVideos: 0,
          analysisRate: 0
        }
      });
    }
    
    // Get unique regions and employees
    const regions = [...new Set(allActivities.map(a => a.organizationInfo?.region).filter(r => r && r !== 'Unknown'))];
    const uniqueEmployees = new Set(allActivities.map(a => a.userId));
    const analyzedVideos = allActivities.filter(a => a.analysisStatus?.isAnalyzed);
    
    console.log(`Active regions: ${regions.join(', ')}`);
    console.log(`Unique employees: ${uniqueEmployees.size}`);
    console.log(`Analyzed videos: ${analyzedVideos.length}`);
    
    // Find the earliest and latest upload dates
    const earliestDate = new Date(allActivities[0].uploadDate);
    const latestDate = new Date(allActivities[allActivities.length - 1].uploadDate);
    
    // Calculate week boundaries (starting from earliest date)
    const weeklyData: WeeklyData[] = [];
    const regionTotals: { [region: string]: number[] } = {};
    
    // Initialize regions
    regions.forEach(region => {
      regionTotals[region] = [];
    });
    
    // Generate weekly data for up to 10 weeks or until latest date
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let currentWeekStart = new Date(earliestDate);
    let weekNumber = 1;
    let cumulativeVideos = 0;
    
    while (weekNumber <= 10 && currentWeekStart <= latestDate) {
      const weekEnd = new Date(currentWeekStart.getTime() + msPerWeek);
      
      // Count videos uploaded in this week
      const weekActivities = allActivities.filter(activity => {
        const uploadDate = new Date(activity.uploadDate);
        return uploadDate >= currentWeekStart && uploadDate < weekEnd;
      });
      
      // Count by region for this week
      const regionBreakdown: { [region: string]: number } = {};
      regions.forEach(region => regionBreakdown[region] = 0);
      
      weekActivities.forEach(activity => {
        const region = activity.organizationInfo?.region;
        if (region && region !== 'Unknown' && regions.includes(region)) {
          regionBreakdown[region] = (regionBreakdown[region] || 0) + 1;
        }
      });
      
      cumulativeVideos += weekActivities.length;
      const weeklyIncrease = weekActivities.length;
      
      // Format date range
      const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      weeklyData.push({
        week: weekNumber,
        weekLabel: weekNumber.toString(),
        dateRange: `${startStr}-${endStr}`,
        totalVideos: cumulativeVideos,
        weeklyIncrease,
        regionBreakdown
      });
      
      // Update region totals (cumulative)
      regions.forEach(region => {
        const previousTotal = regionTotals[region][weekNumber - 2] || 0;
        regionTotals[region].push(previousTotal + (regionBreakdown[region] || 0));
      });
      
      currentWeekStart = weekEnd;
      weekNumber++;
    }
    
    // Prepare weekly increases data for bar chart
    const weeklyIncreases = {
      labels: weeklyData.map(w => w.dateRange),
      data: weeklyData.map(w => w.weeklyIncrease)
    };
    
    // Calculate analysis rate
    const analysisRate = allActivities.length > 0 
      ? Math.round((analyzedVideos.length / allActivities.length) * 100) 
      : 0;
    
    // Calculate summary
    const summary = {
      totalVideos: allActivities.length,
      totalEmployees: uniqueEmployees.size,
      activeRegions: regions,
      latestWeekIncrease: weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].weeklyIncrease : 0,
      totalAnalyzedVideos: analyzedVideos.length,
      analysisRate
    };
    
    const response: BasecampStatusResponse = {
      weeklyData,
      regionTotals,
      weeklyIncreases,
      summary
    };
    
    console.log('Basecamp status summary:', summary);
    console.log(`Generated ${weeklyData.length} weeks of data`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching basecamp status data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch basecamp status data' },
      { status: 500 }
    );
  }
}