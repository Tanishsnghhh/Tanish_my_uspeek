import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';

interface CircleData {
  circle: string;
  totalParticipants: number;
  uploadedVideos: number;
  noUploadParticipants: number;
  videosUploaded: number;
  aos: number;
  maxOS: number;
  minOS: number;
  ir: string;
  videoUploadRate: string;
}

interface RegionCircleData {
  circles: CircleData[];
  total: {
    circle: string;
    totalParticipants: number;
    uploadedVideos: number;
    noUploadParticipants: number;
    videosUploaded: number;
    aos: number;
    maxOS: number;
    minOS: number;
    ir: string;
    videoUploadRate: string;
  };
  keyInsights: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'SOUTH';

  let client: MongoClient | null = null;

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

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('uspeak-pro');

    // Get all employee profiles with their regions and circles for this corporate account
    const employeeProfiles = db.collection('employeeprofiles');
    const videoAnalysis = db.collection('video_analysis');
    const videoActivities = db.collection('videouploadactivities');

    // Get employees for the specified region and corporate account
    const employees = await employeeProfiles.find({
      $and: [
        { corporate_account_id: new ObjectId(authResult.corporateAccountId) },
        { 'custom_attributes.position_1': { $exists: true } },
        { 'custom_attributes.position_1': { $ne: null } },
        { 'custom_attributes.position_1': { $ne: '' } },
        { 'custom_attributes.position_1': region.toUpperCase() }
      ]
    }).toArray();

    console.log(`Found ${employees.length} employees in ${region} region`);

    // Group employees by circle
    const circleMap: { [circle: string]: any[] } = {};
    employees.forEach(employee => {
      const circle = employee.custom_attributes?.position_2 || 'Unknown Circle';
      if (!circleMap[circle]) {
        circleMap[circle] = [];
      }
      circleMap[circle].push(employee);
    });

    // Get video analysis data for this corporate account only
    const accountFilter = {
      $or: [
        { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
        { 'uploadInfo.accountId': authResult.corporateAccountId }
      ]
    };
    const videoAnalysisData = await videoAnalysis.find(accountFilter).toArray();
    console.log(`Found ${videoAnalysisData.length} video analysis records`);

    // Create a map of userId to circle from employee profiles
    const userCircleMap: { [userId: string]: string } = {};
    employees.forEach(employee => {
      const userId = employee.user_id;
      const circle = employee.custom_attributes?.position_2 || 'Unknown Circle';
      if (userId && circle) {
        userCircleMap[userId] = circle;
        userCircleMap[`EMPLOYEE:${userId}`] = circle;
      }
    });

    // Group video analysis by userId
    const userVideos: { [userId: string]: any[] } = {};
    videoAnalysisData.forEach(video => {
      const userId = video.uploadInfo?.userId;
      if (userId && userCircleMap[userId]) {
        if (!userVideos[userId]) {
          userVideos[userId] = [];
        }
        userVideos[userId].push(video);
      }
    });

    // Calculate improvement per user
    const userImprovements: { [userId: string]: {
      improvementRate: number,
      averageScore: number,
      maxOS: number,
      minOS: number,
      videosUploaded: number
    } } = {};

    for (const [userId, videos] of Object.entries(userVideos)) {
      videos.sort((a, b) => new Date(a.uploadInfo?.uploadDate || 0).getTime() - new Date(b.uploadInfo?.uploadDate || 0).getTime());

      const overallScores = videos.map(video => video.wordPowerAnalysis?.overallScore || 0).filter(score => score > 0);

      if (overallScores.length === 0) continue;

      let improvementRate = 0;
      let latestScore = overallScores[overallScores.length - 1];

      if (overallScores.length >= 2) {
        const firstScore = overallScores[0];
        improvementRate = firstScore > 0 ? ((latestScore - firstScore) / firstScore) * 100 : 0;
      } else {
        const baselineScore = 50;
        improvementRate = latestScore > baselineScore ? ((latestScore - baselineScore) / baselineScore) * 100 : 0;
      }

      userImprovements[userId] = {
        improvementRate,
        averageScore: latestScore,
        maxOS: overallScores.length > 0 ? Math.max(...overallScores) : 0,
        minOS: overallScores.length > 0 ? Math.min(...overallScores) : 0,
        videosUploaded: videos.length
      };
    }

    // Calculate circle-wise data
    const circles: CircleData[] = [];
    let totalParticipants = 0;
    let totalUploadedVideos = 0;
    let totalVideosUploaded = 0;
    let totalAOS = 0;
    let totalMaxOS = 0;
    let totalMinOS = 0;
    let totalIR = 0;
    let circlesWithData = 0;

    for (const [circleName, circleEmployees] of Object.entries(circleMap)) {
      const circleUserIds = circleEmployees.map(emp => emp.user_id);
      const circleImprovements = circleUserIds
        .map(userId => userImprovements[userId] || userImprovements[`EMPLOYEE:${userId}`])
        .filter(Boolean);

      const totalParticipantsInCircle = circleEmployees.length;
      const uploadedVideosInCircle = circleImprovements.length;
      const noUploadParticipantsInCircle = totalParticipantsInCircle - uploadedVideosInCircle;

      let videosUploadedInCircle = 0;
      let aosInCircle = 0;
      let maxOSInCircle = 0;
      let minOSInCircle = 0;
      let irInCircle = 0;

      if (circleImprovements.length > 0) {
        videosUploadedInCircle = circleImprovements.reduce((sum, imp) => sum + imp.videosUploaded, 0);
        aosInCircle = circleImprovements.reduce((sum, imp) => sum + imp.averageScore, 0) / circleImprovements.length;
        maxOSInCircle = Math.max(...circleImprovements.map(imp => imp.maxOS));
        minOSInCircle = Math.min(...circleImprovements.map(imp => imp.minOS));
        irInCircle = circleImprovements.reduce((sum, imp) => sum + imp.improvementRate, 0) / circleImprovements.length;

        totalAOS += aosInCircle;
        totalMaxOS += maxOSInCircle;
        totalMinOS += minOSInCircle;
        totalIR += irInCircle;
        circlesWithData++;
      }

      const videoUploadRate = totalParticipantsInCircle > 0 ? Math.round((uploadedVideosInCircle / totalParticipantsInCircle) * 100) : 0;

      circles.push({
        circle: circleName,
        totalParticipants: totalParticipantsInCircle,
        uploadedVideos: uploadedVideosInCircle,
        noUploadParticipants: noUploadParticipantsInCircle,
        videosUploaded: videosUploadedInCircle,
        aos: Math.round(aosInCircle * 100) / 100,
        maxOS: Math.round(maxOSInCircle * 100) / 100,
        minOS: Math.round(minOSInCircle * 100) / 100,
        ir: `${Math.round(irInCircle)}%`,
        videoUploadRate: `${videoUploadRate}%`
      });

      totalParticipants += totalParticipantsInCircle;
      totalUploadedVideos += uploadedVideosInCircle;
      totalVideosUploaded += videosUploadedInCircle;
    }

    // Sort circles by improvement rate (descending)
    circles.sort((a, b) => parseFloat(b.ir) - parseFloat(a.ir));

    // Calculate totals
    const avgAOS = circlesWithData > 0 ? totalAOS / circlesWithData : 0;
    const avgMaxOS = circlesWithData > 0 ? totalMaxOS / circlesWithData : 0;
    const avgMinOS = circlesWithData > 0 ? totalMinOS / circlesWithData : 0;
    const avgIR = circlesWithData > 0 ? totalIR / circlesWithData : 0;
    const overallVideoUploadRate = totalParticipants > 0 ? Math.round((totalUploadedVideos / totalParticipants) * 100) : 0;

    const total = {
      circle: 'Total',
      totalParticipants,
      uploadedVideos: totalUploadedVideos,
      noUploadParticipants: totalParticipants - totalUploadedVideos,
      videosUploaded: totalVideosUploaded,
      aos: Math.round(avgAOS * 100) / 100,
      maxOS: Math.round(avgMaxOS * 100) / 100,
      minOS: Math.round(avgMinOS * 100) / 100,
      ir: `${Math.round(avgIR)}%`,
      videoUploadRate: `${overallVideoUploadRate}%`
    };

    // Generate key insights based on data
    const keyInsights = generateKeyInsights(circles, region);

    const result: RegionCircleData = {
      circles,
      total,
      keyInsights
    };

    console.log(`Returning circle data for ${region} region:`, result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching circle improvement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circle improvement data' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function generateKeyInsights(circles: CircleData[], region: string): string[] {
  const insights: string[] = [];

  if (circles.length === 0) {
    return ["No circle data available for this region."];
  }

  // Find highest and lowest performing circles
  const sortedByIR = [...circles].sort((a, b) => parseFloat(b.ir) - parseFloat(a.ir));
  const sortedByUploadRate = [...circles].sort((a, b) => parseFloat(b.videoUploadRate) - parseFloat(a.videoUploadRate));

  const topCircle = sortedByIR[0];
  const lowestCircle = sortedByIR[sortedByIR.length - 1];
  const topUploadCircle = sortedByUploadRate[0];

  if (topCircle) {
    insights.push(`${topCircle.circle} shows the highest improvement rate at ${topCircle.ir}.`);
  }

  if (lowestCircle && lowestCircle !== topCircle) {
    insights.push(`${lowestCircle.circle} has the lowest improvement rate at ${lowestCircle.ir}.`);
  }

  if (topUploadCircle) {
    insights.push(`${topUploadCircle.circle} has the highest video upload rate at ${topUploadCircle.videoUploadRate}.`);
  }

  // Count circles with improvement rate > 20%
  const highPerformingCircles = circles.filter(circle => parseFloat(circle.ir) > 20);
  if (highPerformingCircles.length > 0) {
    insights.push(`${highPerformingCircles.length} circles in ${region} have improvement rates greater than 20%.`);
  }

  // Overall region performance
  const avgIR = circles.reduce((sum, circle) => sum + parseFloat(circle.ir), 0) / circles.length;
  insights.push(`Overall ${region} region shows an average improvement rate of ${Math.round(avgIR)}%.`);

  return insights;
}
