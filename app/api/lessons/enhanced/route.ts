/**
 * 🎓 Enhanced Lessons API with Video Analysis Integration
 * Serves lesson data enhanced with dynamic video analysis from MongoDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedLessonsData, getVideoAnalysisStats } from '@/lib/video-analysis-integration';

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching enhanced lessons data...');

    // Get enhanced lesson data with video analysis
    const lessons = await getEnhancedLessonsData();
    
    // Get statistics about video analysis integration
    const stats = await getVideoAnalysisStats();

    console.log(`✅ Returning ${lessons.length} lessons with video analysis integration`);

    return NextResponse.json({
      success: true,
      lessons,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced Lessons API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch enhanced lessons data',
      lessons: [],
      stats: {
        totalAnalyses: 0,
        recentAnalyses: 0,
        totalFramesProcessed: 0,
        hasConnection: false
      }
    }, { status: 500 });
  }
}

// GET specific lesson with video analysis
export async function POST(request: NextRequest) {
  try {
    const { uploadId } = await request.json();

    if (!uploadId) {
      return NextResponse.json({
        success: false,
        error: 'Upload ID is required'
      }, { status: 400 });
    }

    console.log(`🔍 Fetching lesson data for uploadId: ${uploadId}`);

    const lessons = await getEnhancedLessonsData();
    const lesson = lessons.find(l => l.uploadId === uploadId);

    if (!lesson) {
      return NextResponse.json({
        success: false,
        error: 'Lesson not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lesson,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Lesson Detail API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lesson data'
    }, { status: 500 });
  }
}
