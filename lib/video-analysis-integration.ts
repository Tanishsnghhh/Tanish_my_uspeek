/**
 * 🎯 Video Analysis MongoDB Integration
 * Connects lesson content with dynamic video analysis data
 * Manages frame extraction and thumbnail generation
 */

import { connectDB } from '@/lib/mongodb';

// Interface for lesson data with video analysis integration
export interface LessonWithVideoData {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  rating: number;
  category: string;
  uploadId?: string;
  videoId?: string;
  fallbackImage: string;
  hasVideoAnalysis?: boolean;
  frameCount?: number;
  analysisDate?: Date;
}

// Interface for video analysis data from MongoDB
export interface VideoAnalysisData {
  _id: string;
  uploadInfo: {
    uploadId: string;
    filename: string;
    fileSize: number;
    duration: string;
    durationSeconds: number;
    uploadDate: Date;
    language: string;
    userId: string;
    accountId: string;
  };
  bodyLanguageAnalysis?: {
    framesProcessed: number;
    processingDuration: string;
    gestures: any;
  };
  processingInfo?: {
    processedDate: Date;
    technologies: any;
  };
}

/**
 * Fetch video analysis data for lessons
 */
export async function getLessonVideoAnalysis(uploadId: string): Promise<VideoAnalysisData | null> {
  try {
    const { db } = await connectDB();
    const videoAnalysisCollection = db.collection('video_analysis');
    
    const videoAnalysis = await videoAnalysisCollection.findOne({
      'uploadInfo.uploadId': uploadId
    }) as unknown as VideoAnalysisData | null;

    return videoAnalysis;
  } catch (error) {
    console.error(`❌ Error fetching video analysis for ${uploadId}:`, error);
    return null;
  }
}

/**
 * Get all available video analysis data for lessons
 */
export async function getAllLessonVideoData(): Promise<VideoAnalysisData[]> {
  try {
    const { db } = await connectDB();
    const videoAnalysisCollection = db.collection('video_analysis');
    
    const videoAnalyses = await videoAnalysisCollection
      .find({
        'uploadInfo.uploadId': { $exists: true }
      })
      .sort({ 'processingInfo.processedDate': -1 })
      .limit(50) // Limit to most recent 50 analyses
      .toArray() as unknown as VideoAnalysisData[];

    return videoAnalyses;
  } catch (error) {
    console.error('❌ Error fetching video analyses:', error);
    return [];
  }
}

/**
 * Enhanced lesson data with video analysis integration
 */
export async function getEnhancedLessonsData(): Promise<LessonWithVideoData[]> {
  // Base lesson data
  const baseLessons: Omit<LessonWithVideoData, 'hasVideoAnalysis' | 'frameCount' | 'analysisDate'>[] = [
    {
      id: 1,
      title: 'Mastering Eye Contact',
      description: 'Learn how to maintain appropriate eye contact to build trust and engagement',
      duration: '15 min',
      difficulty: 'Beginner',
      rating: 4.8,
      category: 'Body Language',
      uploadId: 'eye-contact-lesson',
      fallbackImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Voice Modulation Techniques',
      description: 'Discover how to vary your pitch, pace, and volume for maximum impact',
      duration: '22 min',
      difficulty: 'Intermediate',
      rating: 4.9,
      category: 'Vocal Tone',
      uploadId: 'voice-modulation-lesson',
      fallbackImage: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'Eliminating Filler Words',
      description: 'Strategies to reduce "um", "uh", and other verbal fillers in your speech',
      duration: '18 min',
      difficulty: 'Beginner',
      rating: 4.7,
      category: 'Word Power',
      uploadId: 'filler-words-lesson',
      fallbackImage: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  try {
    // Get all video analysis data
    const videoAnalyses = await getAllLessonVideoData();
    
    // Create a map for quick lookup
    const videoAnalysisMap = new Map<string, VideoAnalysisData>();
    videoAnalyses.forEach(analysis => {
      if (analysis.uploadInfo?.uploadId) {
        videoAnalysisMap.set(analysis.uploadInfo.uploadId, analysis);
      }
    });

    // Enhance lessons with video analysis data
    const enhancedLessons: LessonWithVideoData[] = baseLessons.map(lesson => {
      const videoAnalysis = lesson.uploadId ? videoAnalysisMap.get(lesson.uploadId) : null;
      
      return {
        ...lesson,
        hasVideoAnalysis: !!videoAnalysis,
        frameCount: videoAnalysis?.bodyLanguageAnalysis?.framesProcessed,
        analysisDate: videoAnalysis?.processingInfo?.processedDate
      };
    });

    // Add any additional video analyses not in base lessons
    videoAnalyses.forEach((analysis, index) => {
      const existingLesson = enhancedLessons.find(
        lesson => lesson.uploadId === analysis.uploadInfo.uploadId
      );
      
      if (!existingLesson && analysis.uploadInfo) {
        enhancedLessons.push({
          id: 1000 + index,
          title: analysis.uploadInfo.filename.replace(/\.(mp4|avi|mov|wmv)$/i, ''),
          description: `Video analysis lesson generated from ${analysis.uploadInfo.filename}`,
          duration: analysis.uploadInfo.duration || '0 min',
          difficulty: 'Intermediate',
          rating: 4.0,
          category: 'Analysis',
          uploadId: analysis.uploadInfo.uploadId,
          fallbackImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
          hasVideoAnalysis: true,
          frameCount: analysis.bodyLanguageAnalysis?.framesProcessed,
          analysisDate: analysis.processingInfo?.processedDate
        });
      }
    });

    console.log(`✅ Enhanced ${enhancedLessons.length} lessons with video analysis data`);
    return enhancedLessons;
    
  } catch (error) {
    console.error('❌ Error enhancing lessons with video data:', error);
    // Return base lessons without enhancement
    return baseLessons.map(lesson => ({
      ...lesson,
      hasVideoAnalysis: false
    }));
  }
}

/**
 * Get the most suitable frame for a video thumbnail
 * Prioritizes middle frames for better representation
 */
export async function getBestFrameForThumbnail(uploadId: string): Promise<string | null> {
  try {
    const videoAnalysis = await getLessonVideoAnalysis(uploadId);
    
    if (!videoAnalysis?.bodyLanguageAnalysis?.framesProcessed) {
      return null;
    }

    const frameCount = videoAnalysis.bodyLanguageAnalysis.framesProcessed;
    
    // Choose frame around 25% into the video for better representation
    const targetFramePercentage = 0.25;
    const frameNumber = Math.floor(frameCount * targetFramePercentage);
    
    // Format frame filename (assuming Django format)
    const paddedFrameNumber = frameNumber.toString().padStart(5, '0');
    return `frame_${paddedFrameNumber}.jpg`;
    
  } catch (error) {
    console.error(`❌ Error getting best frame for ${uploadId}:`, error);
    return null;
  }
}

/**
 * Statistics about video analysis integration
 */
export async function getVideoAnalysisStats() {
  try {
    const { db } = await connectDB();
    const videoAnalysisCollection = db.collection('video_analysis');
    
    const totalAnalyses = await videoAnalysisCollection.countDocuments();
    const recentAnalyses = await videoAnalysisCollection.countDocuments({
      'processingInfo.processedDate': {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    });
    
    const totalFramesProcessed = await videoAnalysisCollection.aggregate([
      { $match: { 'bodyLanguageAnalysis.framesProcessed': { $exists: true } } },
      { $group: { _id: null, totalFrames: { $sum: '$bodyLanguageAnalysis.framesProcessed' } } }
    ]).toArray();

    return {
      totalAnalyses,
      recentAnalyses,
      totalFramesProcessed: totalFramesProcessed[0]?.totalFrames || 0,
      hasConnection: true
    };
  } catch (error) {
    console.error('❌ Error getting video analysis stats:', error);
    return {
      totalAnalyses: 0,
      recentAnalyses: 0,
      totalFramesProcessed: 0,
      hasConnection: false
    };
  }
}
