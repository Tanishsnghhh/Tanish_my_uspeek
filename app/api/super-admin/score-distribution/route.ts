import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const VIDEO_ANALYSIS_COLLECTION = 'video_analysis';

// GET - Fetch score distribution data for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const videoAnalysisCollection = db.collection(VIDEO_ANALYSIS_COLLECTION);

    // Get score distribution from video_analysis collection
    const scoreDistribution = await videoAnalysisCollection.aggregate([
      {
        $match: {
          'overallPerformance.totalScore': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$overallPerformance.totalScore',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]).toArray();

    // Get detailed score information
    const detailedScores = await videoAnalysisCollection.find({
      'overallPerformance.totalScore': { $exists: true, $ne: null }
    })
    .project({
      _id: 1,
      'uploadInfo.filename': 1,
      'overallPerformance.totalScore': 1,
      'overallPerformance.performanceLevel': 1,
      'overallPerformance.vocalScore': 1,
      'overallPerformance.wordScore': 1,
      'overallPerformance.bodyScore': 1
    })
    .limit(10)
    .toArray();

    // Format the score distribution data
    const formattedScoreDistribution = scoreDistribution.map(score => ({
      score: score._id.toString(),
      count: score.count
    }));

    // Calculate statistics
    const totalVideos = scoreDistribution.reduce((sum, item) => sum + item.count, 0);
    const minScore = Math.min(...scoreDistribution.map(item => item._id));
    const maxScore = Math.max(...scoreDistribution.map(item => item._id));
    const avgScore = scoreDistribution.reduce((sum, item) => sum + (item._id * item.count), 0) / totalVideos;

    console.log('Score distribution stats:', { 
      totalVideos, 
      minScore, 
      maxScore, 
      avgScore: avgScore.toFixed(2),
      distributionCount: formattedScoreDistribution.length 
    });

    return NextResponse.json({
      success: true,
      data: {
        scoreDistribution: formattedScoreDistribution,
        statistics: {
          totalVideos,
          minScore,
          maxScore,
          averageScore: parseFloat(avgScore.toFixed(2))
        },
        sampleVideos: detailedScores
      }
    });

  } catch (error: any) {
    console.error('Error fetching score distribution:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch score distribution',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
