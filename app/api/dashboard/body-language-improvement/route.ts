import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';

interface OverallImprovementData {
  improvementRate: number;
  totalVideos: number;
  averageScore: number;
  usersAnalyzed: number;
  baselineScore: number;
}

export async function GET(request: NextRequest) {
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
    
    const videoAnalysis = db.collection('video_analysis');
    
    // Build filter for corporate account
    const accountFilter = {
      $and: [
        { 'bodyLanguageAnalysis.overallScore': { $exists: true, $ne: null } },
        {
          $or: [
            { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
            { 'uploadInfo.accountId': authResult.corporateAccountId }
          ]
        }
      ]
    };
    
    // Get videos with body language analysis for this corporate account only
    const allVideos = await videoAnalysis.find(accountFilter)
      .sort({ 'uploadInfo.uploadDate': 1 })
      .toArray();
    
    console.log(`Found ${allVideos.length} videos with body language analysis`);
    
    if (allVideos.length === 0) {
      return NextResponse.json({
        improvementRate: 0,
        totalVideos: 0,
        averageScore: 0,
        usersAnalyzed: 0
      });
    }
    
    // Group videos by user to calculate individual improvements
    const userVideos: { [userId: string]: any[] } = {};
    
    for (const video of allVideos) {
      const userId = video.uploadInfo?.userId || 'unknown';
      // Extract clean userId by removing EMPLOYEE: prefix if present
      const cleanUserId = userId.startsWith('EMPLOYEE:') ? userId.replace('EMPLOYEE:', '') : userId;
      
      if (!userVideos[cleanUserId]) {
        userVideos[cleanUserId] = [];
      }
      userVideos[cleanUserId].push(video);
    }
    
    // Fixed baseline targets for body language improvement
    const baselineScore = 45; // Target baseline for body language
    
    let totalImprovementRate = 0;
    let totalScore = 0;
    let usersWithImprovement = 0;
    
    // Calculate improvement for each user
    for (const userId in userVideos) {
      const videos = userVideos[userId].sort((a, b) => 
        new Date(a.uploadInfo?.uploadDate).getTime() - new Date(b.uploadInfo?.uploadDate).getTime()
      );
      
      if (videos.length >= 2) {
        // Multiple videos: calculate improvement from first to latest
        const firstScore = videos[0].bodyLanguageAnalysis?.overallScore || 0;
        const latestScore = videos[videos.length - 1].bodyLanguageAnalysis?.overallScore || 0;
        
        if (firstScore > 0) {
          const improvementRate = ((latestScore - firstScore) / firstScore) * 100;
          totalImprovementRate += improvementRate;
          totalScore += latestScore;
          usersWithImprovement++;
        }
      } else {
        // Single video: compare with baseline
        const score = videos[0].bodyLanguageAnalysis?.overallScore || 0;
        
        if (score > baselineScore) {
          const improvementRate = ((score - baselineScore) / baselineScore) * 100;
          totalImprovementRate += improvementRate;
          totalScore += score;
          usersWithImprovement++;
        }
      }
    }
    
    // Calculate average score across ALL videos (not just users with improvement)
    const totalScoreAllVideos = allVideos.reduce((sum, video) => 
      sum + (video.bodyLanguageAnalysis?.overallScore || 0), 0
    );
    const overallAverageScore = allVideos.length > 0 ? Math.round(totalScoreAllVideos / allVideos.length) : 0;

    const result: OverallImprovementData = {
      improvementRate: overallAverageScore, // Using averageScore instead of improvement rate
      totalVideos: allVideos.length,
      averageScore: overallAverageScore,
      usersAnalyzed: Object.keys(userVideos).length,
      baselineScore: baselineScore
    };
    
    console.log('Body Language Overall Improvement:', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching body language improvement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch body language improvement data' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}