import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';
import { ObjectId } from 'mongodb';

interface AdminMetricsResponse {
  overallImprovementRate: number;
  totalVideosUploaded: number;
  totalTrainingTime: string;
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
    const videoAnalysis = db.collection('video_analysis');

    // Build filter for corporate account
    const accountFilter = {
      $or: [
        { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
        { 'uploadInfo.accountId': authResult.corporateAccountId }
      ]
    };

    // Get video analysis records for this corporate account only
    const allRecords = await videoAnalysis.find(accountFilter).toArray();

    if (allRecords.length === 0) {
      return NextResponse.json({
        overallImprovementRate: 0,
        totalVideosUploaded: 0,
        totalTrainingTime: '0m 0s'
      });
    }

    // Calculate overall improvement rate (average of overall scores)
    const recordsWithScores = allRecords.filter(record =>
      record.overallPerformance?.totalScore && record.overallPerformance.totalScore > 0
    );

    const overallImprovementRate = recordsWithScores.length > 0
      ? Math.round(recordsWithScores.reduce((sum, record) =>
          sum + (record.overallPerformance?.totalScore || 0), 0) / recordsWithScores.length)
      : 0;

    // Total videos uploaded
    const totalVideosUploaded = allRecords.length;

    // Total training hours (sum of parsed durations)
    const totalSeconds = allRecords.reduce((sum, record) => {
      const durationStr = record.uploadInfo?.duration;
      if (durationStr && typeof durationStr === 'string') {
        const parts = durationStr.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const seconds = parseInt(parts[2]) || 0;
          return sum + (hours * 3600) + (minutes * 60) + seconds;
        }
      }
      return sum + (record.uploadInfo?.durationSeconds || 0);
    }, 0);

    // Format training time: show minutes/seconds if < 1 hour, otherwise show hours
    let totalTrainingTime: string;
    if (totalSeconds < 3600) {
      // Less than 1 hour: show minutes and seconds
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      totalTrainingTime = `${minutes}m ${seconds}s`;
    } else {
      // 1 hour or more: show decimal hours
      const hours = Math.round((totalSeconds / 3600) * 10) / 10; // Round to 1 decimal place
      totalTrainingTime = `${hours}h`;
    }

    const response: AdminMetricsResponse = {
      overallImprovementRate,
      totalVideosUploaded,
      totalTrainingTime
    };

    console.log('Admin metrics:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin metrics' },
      { status: 500 }
    );
  }
}
