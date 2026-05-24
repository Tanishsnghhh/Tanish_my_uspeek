import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';

interface CircleAnalysisData {
  circle: string;
  bodyLanguage: number;
  bodyLanguageImprovement: string;
  vocalTone: number;
  vocalToneImprovement: string;
  wordPower: number;
  wordPowerImprovement: string;
}

interface AnalysisResult {
  circles: CircleAnalysisData[];
  summary: {
    bodyLanguageImprovement: string;
    vocalToneImprovement: string;
    wordPowerImprovement: string;
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

    // Get all employee profiles with their regions and circles
    const employeeProfiles = db.collection('employeeprofiles');
    const videoAnalysis = db.collection('video_analysis');

    // Get employees for the specified region within the corporate account
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

    console.log('Circle distribution:', Object.keys(circleMap).map(circle => `${circle}: ${circleMap[circle].length} employees`));

    // Get all video analysis data for this corporate account
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
      if (userId) {
        // Convert ObjectId to string and create both formats
        const userIdStr = userId.toString();
        userCircleMap[userIdStr] = circle;
        userCircleMap[`EMPLOYEE:${userIdStr}`] = circle;
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

    console.log(`Found ${Object.keys(userVideos).length} users with video data`);
    console.log('Users with videos:', Object.keys(userVideos));

    // Calculate improvement per user for each category
    const userImprovements: { [userId: string]: {
      bodyLanguage: {
        improvementRate: number;
        averageScore: number;
        maxScore: number;
        minScore: number;
      };
      vocalTone: {
        improvementRate: number;
        averageScore: number;
        maxScore: number;
        minScore: number;
      };
      wordPower: {
        improvementRate: number;
        averageScore: number;
        maxScore: number;
        minScore: number;
      };
    } } = {};

    for (const [userId, videos] of Object.entries(userVideos)) {
      videos.sort((a, b) => new Date(a.uploadInfo?.uploadDate || 0).getTime() - new Date(b.uploadInfo?.uploadDate || 0).getTime());

      const bodyLanguageScores = videos.map(video => video.bodyLanguageAnalysis?.overallScore || 0).filter(score => score > 0);
      const vocalToneScores = videos.map(video => video.vocalAnalysis?.overallScore || 0).filter(score => score > 0);
      const wordPowerScores = videos.map(video => video.wordPowerAnalysis?.overallScore || 0).filter(score => score > 0);

      console.log(`User ${userId}: ${videos.length} videos`);
      console.log(`  Body Language scores: ${bodyLanguageScores}`);
      console.log(`  Vocal Tone scores: ${vocalToneScores}`);
      console.log(`  Word Power scores: ${wordPowerScores}`);

      const calculateImprovement = (scores: number[], baselineScore: number) => {
        if (scores.length === 0) return { improvementRate: 0, averageScore: 0, maxScore: 0, minScore: 0 };

        let improvementRate = 0;
        let latestScore = scores[scores.length - 1];

        if (scores.length >= 2) {
          const firstScore = scores[0];
          improvementRate = firstScore > 0 ? ((latestScore - firstScore) / firstScore) * 100 : 0;
        } else {
          // Single video: compare with baseline
          improvementRate = latestScore > baselineScore ? ((latestScore - baselineScore) / baselineScore) * 100 : 0;
        }

        return {
          improvementRate,
          averageScore: latestScore,
          maxScore: scores.length > 0 ? Math.max(...scores) : 0,
          minScore: scores.length > 0 ? Math.min(...scores) : 0
        };
      };

      userImprovements[userId] = {
        bodyLanguage: calculateImprovement(bodyLanguageScores, 50),
        vocalTone: calculateImprovement(vocalToneScores, 45),
        wordPower: calculateImprovement(wordPowerScores, 48)
      };

      console.log(`User ${userId} improvements:`, userImprovements[userId]);
    }

    // Calculate circle-wise data
    const circles: CircleAnalysisData[] = [];
    let totalBodyLanguageImprovement = 0;
    let totalVocalToneImprovement = 0;
    let totalWordPowerImprovement = 0;
    let circlesWithData = 0;

    for (const [circleName, circleEmployees] of Object.entries(circleMap)) {
      const circleUserIds = circleEmployees.map(emp => emp.user_id.toString());
      const circleImprovements = circleUserIds
        .map(userId => userImprovements[userId] || userImprovements[`EMPLOYEE:${userId}`])
        .filter(Boolean);

      console.log(`Circle ${circleName}: ${circleImprovements.length} users with improvements`);
      console.log(`Circle user IDs: ${circleUserIds}`);

      if (circleImprovements.length === 0) continue;

      // Calculate averages for each category
      const bodyLanguageAvg = circleImprovements.reduce((sum, imp) => sum + imp.bodyLanguage.averageScore, 0) / circleImprovements.length;
      const bodyLanguageImprovementAvg = circleImprovements.reduce((sum, imp) => sum + imp.bodyLanguage.improvementRate, 0) / circleImprovements.length;

      const vocalToneAvg = circleImprovements.reduce((sum, imp) => sum + imp.vocalTone.averageScore, 0) / circleImprovements.length;
      const vocalToneImprovementAvg = circleImprovements.reduce((sum, imp) => sum + imp.vocalTone.improvementRate, 0) / circleImprovements.length;

      const wordPowerAvg = circleImprovements.reduce((sum, imp) => sum + imp.wordPower.averageScore, 0) / circleImprovements.length;
      const wordPowerImprovementAvg = circleImprovements.reduce((sum, imp) => sum + imp.wordPower.improvementRate, 0) / circleImprovements.length;

      circles.push({
        circle: circleName,
        bodyLanguage: Math.round(bodyLanguageAvg * 100) / 100,
        bodyLanguageImprovement: `${Math.round(bodyLanguageImprovementAvg)}%`,
        vocalTone: Math.round(vocalToneAvg * 100) / 100,
        vocalToneImprovement: `${Math.round(vocalToneImprovementAvg)}%`,
        wordPower: Math.round(wordPowerAvg * 100) / 100,
        wordPowerImprovement: `${Math.round(wordPowerImprovementAvg)}%`
      });

      totalBodyLanguageImprovement += bodyLanguageImprovementAvg;
      totalVocalToneImprovement += vocalToneImprovementAvg;
      totalWordPowerImprovement += wordPowerImprovementAvg;
      circlesWithData++;
    }

    // Sort circles by average improvement rate (descending)
    circles.sort((a, b) => {
      const aAvg = (parseFloat(a.bodyLanguageImprovement) + parseFloat(a.vocalToneImprovement) + parseFloat(a.wordPowerImprovement)) / 3;
      const bAvg = (parseFloat(b.bodyLanguageImprovement) + parseFloat(b.vocalToneImprovement) + parseFloat(b.wordPowerImprovement)) / 3;
      return bAvg - aAvg;
    });

    // Calculate summary
    const summary = {
      bodyLanguageImprovement: circlesWithData > 0 ? `${Math.round(totalBodyLanguageImprovement / circlesWithData)}%` : '0%',
      vocalToneImprovement: circlesWithData > 0 ? `${Math.round(totalVocalToneImprovement / circlesWithData)}%` : '0%',
      wordPowerImprovement: circlesWithData > 0 ? `${Math.round(totalWordPowerImprovement / circlesWithData)}%` : '0%'
    };

    // Generate key insights
    const keyInsights = generateKeyInsights(circles, region);

    const result: AnalysisResult = {
      circles,
      summary,
      keyInsights
    };

    console.log(`Returning circles-wise analysis for ${region} region:`, result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching circles-wise analysis data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circles-wise analysis data' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function generateKeyInsights(circles: CircleAnalysisData[], region: string): string[] {
  const insights: string[] = [];

  if (circles.length === 0) {
    return ["No circle data available for this region."];
  }

  // Find highest performing circles for each category
  const sortedByBL = [...circles].sort((a, b) => parseFloat(b.bodyLanguageImprovement) - parseFloat(a.bodyLanguageImprovement));
  const sortedByVT = [...circles].sort((a, b) => parseFloat(b.vocalToneImprovement) - parseFloat(a.vocalToneImprovement));
  const sortedByWP = [...circles].sort((a, b) => parseFloat(b.wordPowerImprovement) - parseFloat(a.wordPowerImprovement));

  const topBL = sortedByBL[0];
  const topVT = sortedByVT[0];
  const topWP = sortedByWP[0];

  if (topBL) {
    insights.push(`${topBL.circle} shows the highest Body Language improvement at ${topBL.bodyLanguageImprovement}.`);
  }

  if (topVT) {
    insights.push(`${topVT.circle} shows the highest Vocal Tone improvement at ${topVT.vocalToneImprovement}.`);
  }

  if (topWP) {
    insights.push(`${topWP.circle} shows the highest Word Power improvement at ${topWP.wordPowerImprovement}.`);
  }

  // Count circles with improvement rate > 20% in each category
  const highBL = circles.filter(circle => parseFloat(circle.bodyLanguageImprovement) > 20);
  const highVT = circles.filter(circle => parseFloat(circle.vocalToneImprovement) > 20);
  const highWP = circles.filter(circle => parseFloat(circle.wordPowerImprovement) > 20);

  if (highBL.length > 0) {
    insights.push(`${highBL.length} circles in ${region} have Body Language improvement rates greater than 20%.`);
  }

  if (highVT.length > 0) {
    insights.push(`${highVT.length} circles in ${region} have Vocal Tone improvement rates greater than 20%.`);
  }

  if (highWP.length > 0) {
    insights.push(`${highWP.length} circles in ${region} have Word Power improvement rates greater than 20%.`);
  }

  // Overall region performance
  const avgBL = circles.reduce((sum, circle) => sum + parseFloat(circle.bodyLanguageImprovement), 0) / circles.length;
  const avgVT = circles.reduce((sum, circle) => sum + parseFloat(circle.vocalToneImprovement), 0) / circles.length;
  const avgWP = circles.reduce((sum, circle) => sum + parseFloat(circle.wordPowerImprovement), 0) / circles.length;

  insights.push(`${region} region shows average improvements of ${Math.round(avgBL)}% in Body Language, ${Math.round(avgVT)}% in Vocal Tone, and ${Math.round(avgWP)}% in Word Power.`);

  return insights;
}
