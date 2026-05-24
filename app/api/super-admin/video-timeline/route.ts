import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const VIDEO_ANALYSIS_COLLECTION = 'video_analysis';

// GET - Fetch video timeline data for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const videoAnalysisCollection = db.collection(VIDEO_ANALYSIS_COLLECTION);

    // Get video timeline (monthly video upload counts) - sorted by date descending
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

    // Get detailed video information for each month
    const detailedTimeline = await videoAnalysisCollection.aggregate([
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
          count: { $sum: 1 },
          videos: {
            $push: {
              id: '$_id',
              filename: '$uploadInfo.filename',
              uploadDate: '$uploadInfo.uploadDate',
              userId: '$uploadInfo.userId',
              totalScore: '$overallPerformance.totalScore'
            }
          }
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

    // Format detailed timeline data
    const formattedDetailedTimeline = detailedTimeline.map(timeline => ({
      date: `${new Date(timeline._id.year, timeline._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${timeline._id.year.toString().slice(-2)}`,
      count: timeline.count,
      videos: timeline.videos
    }));

    // Calculate statistics
    const totalVideos = videoTimeline.reduce((sum, item) => sum + item.count, 0);
    const totalMonths = videoTimeline.length;
    const avgVideosPerMonth = totalMonths > 0 ? (totalVideos / totalMonths).toFixed(1) : 0;
    const maxVideosInMonth = Math.max(...videoTimeline.map(item => item.count));
    const minVideosInMonth = Math.min(...videoTimeline.map(item => item.count));

    console.log('Video timeline stats:', { 
      totalVideos, 
      totalMonths, 
      avgVideosPerMonth, 
      maxVideosInMonth, 
      minVideosInMonth 
    });

    return NextResponse.json({
      success: true,
      data: {
        timeline: formattedTimeline,
        detailedTimeline: formattedDetailedTimeline,
        statistics: {
          totalVideos,
          totalMonths,
          averageVideosPerMonth: parseFloat(avgVideosPerMonth),
          maxVideosInMonth,
          minVideosInMonth
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching video timeline:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch video timeline',
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
