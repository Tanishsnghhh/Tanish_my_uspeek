import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';
const BUSINESS_UNITS_COLLECTION = 'businessunits';
const VIDEO_ANALYSIS_COLLECTION = 'video_analysis';

// GET - Fetch dashboard statistics for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);
    const videoAnalysisCollection = db.collection(VIDEO_ANALYSIS_COLLECTION);

    // Get token from header (optional for now, we'll add auth later)
    const authHeader = request.headers.get('authorization');
    
    // For now, let's fetch data without strict auth to test the connection
    // TODO: Add proper authentication later

    // Fetch total registered users (all users with ACTIVE status)
    const totalUsers = await usersCollection.countDocuments({ status: 'ACTIVE' });

    // Fetch B2B accounts (business units with isActive: true)
    const b2bAccounts = await businessUnitsCollection.countDocuments({ isActive: true });

    // Fetch B2B users (users with corporate accounts - those with account_id)
    const b2bUsers = await usersCollection.countDocuments({ 
      status: 'ACTIVE',
      account_id: { $exists: true, $ne: null }
    });

    // Fetch direct users (users without corporate accounts)
    const directUsers = await usersCollection.countDocuments({ 
      status: 'ACTIVE',
      $or: [
        { account_id: { $exists: false } },
        { account_id: null }
      ]
    });

    // Fetch total videos from video_analysis collection
    const totalVideos = await videoAnalysisCollection.countDocuments({});

    // Get video upload trends (last 12 months) from video_analysis collection
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const videoUploadTrends = await videoAnalysisCollection.aggregate([
      {
        $match: {
          'uploadInfo.uploadDate': { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$uploadInfo.uploadDate' },
            month: { $month: '$uploadInfo.uploadDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Format the trends data
    const formattedTrends = videoUploadTrends.map(trend => ({
      month: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${trend._id.year.toString().slice(-2)}`,
      count: trend.count,
      formattedMonth: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} '${trend._id.year.toString().slice(-2)}`
    }));

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

    // Format the score distribution data
    const formattedScoreDistribution = scoreDistribution.map(score => ({
      score: score._id.toString(),
      count: score.count
    }));

    // Get video analytics timeline (monthly video upload counts)
    const videoTimeline = await videoAnalysisCollection.aggregate([
      {
        $match: {
          'uploadInfo.uploadDate': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$uploadInfo.uploadDate' },
            month: { $month: '$uploadInfo.uploadDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]).toArray();

    // Format the timeline data
    const formattedTimeline = videoTimeline.map(timeline => ({
      date: `${new Date(timeline._id.year, timeline._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${timeline._id.year.toString().slice(-2)}`,
      count: timeline.count
    }));

    console.log('Dashboard stats:', { totalUsers, b2bAccounts, b2bUsers, directUsers, totalVideos, trendsCount: formattedTrends.length, scoreDistributionCount: formattedScoreDistribution.length, timelineCount: formattedTimeline.length });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        b2bAccounts,
        b2bUsers,
        directUsers,
        totalVideos,
        videoUploadTrends: formattedTrends,
        scoreDistribution: formattedScoreDistribution,
        videoTimeline: formattedTimeline
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
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
