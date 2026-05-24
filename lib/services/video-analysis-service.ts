/**
 * Video Analysis Service for U-Speak Pro
 * Comprehensive MongoDB service for video upload and analysis data
 * Based on detailed schema mapping all analysis components
 */

import { ObjectId } from 'mongodb';
import { getVideoAnalysisCollection, getDatabase } from '../database';

// TypeScript Interfaces for Video Analysis Schema

export interface VideoUploadInfo {
  uploadId: string;
  filename: string;
  fileSize: number;
  duration: string;
  durationSeconds: number;
  uploadDate: Date;
  language: string;
  userId?: string;
  accountId: string; // Keep for backward compatibility
  corporate_account_id: ObjectId; // New proper reference to CorporateAccount
  filePath?: string;
}

export interface TranscriptData {
  originalTranscript: string;
  correctedTranscript: string;
  summary: string;
  keywords: string;
  wordCount: number;
  sentences: number;
}

export interface VocalAnalysis {
  overallScore: number;
  scoreOutOfFive: number;
  audio: {
    durationSec: number;
    volumeDb: number;
    meanPitchHz: number;
    pitchRange: string;
    avgPitchRange: number;
    minPitch: number;
    maxPitch: number;
    numPauses: number;
    spokenDurationSec: number;
    speakingTimePercentage: number;
    avgPauseLength?: number;
  };
  quality: {
    clarity: number;
    fluency: number;
    energy: string;
    modulation: number;
    projection: string;
  };
  strengths: string[];
  improvements: string[];
  verdict: string;
}

export interface WordPowerAnalysis {
  overallScore: number;
  scoreOutOfFive: number;
  contentAssessment: {
    qualityScore: number;
    vocabularyDiversity: number;
    vocabularyScore: number;
    clarityScore: number;
    complexityLevel: string;
    contentLength: {
      score: number;
      wordCount: number;
      description: string;
      targetWords?: number;
    };
    fluency: {
      score: number;
      fillerWordsPercentage: number;
      description: string;
    };
    sentenceStructure: {
      score: number;
      avgWordsPerSentence: number;
      sentenceCount: number;
      description: string;
    };
    flow: {
      score: number;
      transitionWordCount: number;
      description: string;
    };
  };
  overallStrength: number;
  strengthLevel: string;
  strengthDescription: string;
  topStrength: string;
  fillerWords: Array<{
    word: string;
    count: number;
    percentage: number;
  }>;
  repeatedWords: Array<{
    word: string;
    count: number;
  }>;
  keyImprovement: string;
  improvements: string[];
}

export interface BodyLanguageAnalysis {
  overallScore: number;
  scoreOutOfFive: number;
  framesProcessed: number;
  processingDuration?: string;
  gestures: {
    smiles: {
      count: number;
      percentage: number;
      description: string;
    };
    headMovement: {
      count: number;
      percentage: number;
      description: string;
      stability: string;
    };
    handMovement: {
      count: number;
      percentage: number;
      description: string;
      effectiveness: string;
    };
    eyeContact: {
      count: number;
      percentage: number;
      description: string;
      engagement: string;
    };
    legMovement: {
      count: number;
      percentage: number;
      description: string;
    };
    footMovement: {
      count: number;
      percentage: number;
      description: string;
    };
  };
  posture: {
    straightPosture: number; 
    shoulderPosition: number;
    stability: string;
    confidence: string;
  };
  topAreas: string[];
  improvements: string[];
  verdict: string;
}

export interface SentimentAnalysis {
  overallSentiment: string;
  confidence: number;
  positiveScore: number;
  negativeScore: number;
  neutralScore: number;
  label: string;
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  confidence: number;
  emotionScores: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
    love: number;
    optimism: number;
    pessimism: number;
    neutral: number;
  };
  detectedKeywords: string[];
}

export interface ConfidenceAnalysis {
  overallConfidence: number;
  confidenceLevel: string;
  confidenceScore: number;
  engagementLevel: string;
  engagementScore: number;
  nervousnessLevel: string;
  nervousnessScore: number;
  positiveIndicators: number;
  negativeIndicators: number;
  confidenceRatio: number;
}

export interface OverallPerformance {
  totalScore: number;
  industryAverage: number;
  performanceLevel: string;
  vocalScore: number;
  wordScore: number;
  bodyScore: number;
  title: string;
  message: string;
  strengths: string[];
  improvements: string[];
}

export interface ProcessingInfo {
  analysisVersion: string;
  processedDate: Date;
  processingTime?: number;
  status: 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  technologies: {
    transcription: string;
    nlp: string;
    bodyLanguage: string;
    audioAnalysis: string;
    sentiment: string;
  };
  qualityFlags: {
    audioQuality: string;
    videoQuality: string;
    transcriptionAccuracy: string;
  };
}

export interface CoachingFeedback {
  summary: string;
  bodyLanguageAnalysis: string;
  vocalAnalysis: string;
  recommendations: string;
  practiceExercises: string[];
  quickWins: string[];
}

export interface ProgressData {
  previousScores: Array<{
    date: Date;
    overallScore: number;
    vocalScore: number;
    wordScore: number;
    bodyScore: number;
  }>;
  improvementTrends: {
    vocal: string;
    wordPower: string;
    bodyLanguage: string;
  };
  goalsSet: string[];
  milestonesAchieved: string[];
}

// Main Video Analysis Document Interface
export interface VideoAnalysisDocument {
  _id?: ObjectId;
  uploadInfo: VideoUploadInfo;
  transcript: TranscriptData;
  vocalAnalysis?: VocalAnalysis;
  wordPowerAnalysis?: WordPowerAnalysis;
  bodyLanguageAnalysis?: BodyLanguageAnalysis;
  sentimentAnalysis?: SentimentAnalysis;
  emotionAnalysis?: EmotionAnalysis;
  confidenceAnalysis?: ConfidenceAnalysis;
  overallPerformance?: OverallPerformance;
  processingInfo: ProcessingInfo;
  coachingFeedback?: CoachingFeedback;
  progressData?: ProgressData;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}

// Video Analysis Service Class
export class VideoAnalysisService {
  
  /**
   * Create a new video analysis document
   */
  async createVideoAnalysis(data: Partial<VideoAnalysisDocument>): Promise<string> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const document: VideoAnalysisDocument = {
        uploadInfo: data.uploadInfo!,
        transcript: data.transcript || {
          originalTranscript: '',
          correctedTranscript: '',
          summary: '',
          keywords: '',
          wordCount: 0,
          sentences: 0
        },
        processingInfo: data.processingInfo || {
          analysisVersion: 'v2.1.0',
          processedDate: new Date(),
          status: 'uploading',
          stage: 'upload_complete',
          progress: 10,
          technologies: {
            transcription: 'OpenAI Whisper',
            nlp: 'Gemini AI + HuggingFace Transformers',
            bodyLanguage: 'MediaPipe + DeepFace',
            audioAnalysis: 'Parselmouth',
            sentiment: 'Custom Engine + Transformers'
          },
          qualityFlags: {
            audioQuality: 'Unknown',
            videoQuality: 'Unknown',
            transcriptionAccuracy: 'Unknown'
          }
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '2.1.0'
        },
        ...data
      };
      
      const result = await collection.insertOne(document);
      console.log(`✅ Video analysis created with ID: ${result.insertedId}`);
      
      return result.insertedId.toString();
    } catch (error) {
      console.error('❌ Error creating video analysis:', error);
      throw error;
    }
  }

  /**
   * Get video analysis by uploadId and accountId
   */
  async getVideoAnalysis(uploadId: string, accountId: string): Promise<VideoAnalysisDocument | null> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const document = await collection.findOne({
        'uploadInfo.uploadId': uploadId,
        'uploadInfo.accountId': accountId
      });
      
      return document as VideoAnalysisDocument | null;
    } catch (error) {
      console.error('❌ Error getting video analysis:', error);
      throw error;
    }
  }

  /**
   * Update video analysis data
   */
  async updateAnalysisData(uploadId: string, accountId: string, updateData: any): Promise<boolean> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      // Add metadata update
      updateData['metadata.updatedAt'] = new Date();
      
      const result = await collection.updateOne(
        {
          'uploadInfo.uploadId': uploadId,
          'uploadInfo.accountId': accountId
        },
        { $set: updateData }
      );
      
      console.log(`✅ Video analysis updated: ${result.modifiedCount} document(s) modified`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Error updating video analysis:', error);
      throw error;
    }
  }

  /**
   * Update processing progress
   */
  async updateProgress(
    uploadId: string, 
    accountId: string, 
    status: ProcessingInfo['status'],
    progress: number,
    stage: string
  ): Promise<boolean> {
    try {
      const updateData = {
        'processingInfo.status': status,
        'processingInfo.progress': progress,
        'processingInfo.stage': stage,
        'metadata.updatedAt': new Date()
      };
      
      return await this.updateAnalysisData(uploadId, accountId, updateData);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get pending jobs for processing
   */
  async getPendingJobs(accountId: string, status: ProcessingInfo['status']): Promise<VideoAnalysisDocument[]> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const documents = await collection.find({
        'uploadInfo.accountId': accountId,
        'processingInfo.status': status
      }).sort({ 'metadata.createdAt': 1 }).toArray();
      
      return documents as VideoAnalysisDocument[];
    } catch (error) {
      console.error('❌ Error getting pending jobs:', error);
      throw error;
    }
  }

  /**
   * Get user's video history
   */
  async getUserVideos(userId: string, accountId: string, limit: number = 10): Promise<VideoAnalysisDocument[]> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const documents = await collection.find({
        'uploadInfo.userId': userId,
        'uploadInfo.accountId': accountId
      })
      .sort({ 'uploadInfo.uploadDate': -1 })
      .limit(limit)
      .toArray();
      
      return documents as VideoAnalysisDocument[];
    } catch (error) {
      console.error('❌ Error getting user videos:', error);
      throw error;
    }
  }

  /**
   * Get performance statistics for a user
   */
  async getPerformanceStats(userId: string, accountId: string): Promise<any> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const stats = await collection.aggregate([
        {
          $match: {
            'uploadInfo.userId': userId,
            'uploadInfo.accountId': accountId,
            'overallPerformance.totalScore': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgOverallScore: { $avg: '$overallPerformance.totalScore' },
            avgVocalScore: { $avg: '$vocalAnalysis.overallScore' },
            avgWordScore: { $avg: '$wordPowerAnalysis.overallScore' },
            avgBodyScore: { $avg: '$bodyLanguageAnalysis.overallScore' },
            totalVideos: { $sum: 1 },
            latestScore: { $last: '$overallPerformance.totalScore' }
          }
        }
      ]).toArray();
      
      return stats[0] || {
        avgOverallScore: 0,
        avgVocalScore: 0,
        avgWordScore: 0,
        avgBodyScore: 0,
        totalVideos: 0,
        latestScore: 0
      };
    } catch (error) {
      console.error('❌ Error getting performance stats:', error);
      throw error;
    }
  }

  /**
   * List video analyses with filtering and pagination
   */
  async listVideoAnalyses(accountId: string, options: {
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    performanceLevel?: string;
    language?: string;
    minDuration?: number;
    maxDuration?: number;
    userId?: string;
    userRole?: string;
  } = {}): Promise<VideoAnalysisDocument[]> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const {
        limit = 50,
        skip = 0,
        sortBy = 'uploadDate',
        sortOrder = 'desc',
        search = '',
        dateFrom,
        dateTo,
        status,
        performanceLevel,
        language,
        minDuration,
        maxDuration,
        userId,
        userRole
      } = options;
      
      // Build query filter
      const filter: any = {
        'uploadInfo.accountId': accountId
      };
      
      // Add user filter for non-admin users
      if (userId && userRole) {
        // For employees, only show videos uploaded by themselves
        // userId now contains the full userId header (e.g., "EMPLOYEE:68d16f1bf7e35a47723c0540")
        filter['uploadInfo.userId'] = userId;
      }
      
      // Add search filter
      if (search) {
        filter.$or = [
          { 'uploadInfo.filename': { $regex: search, $options: 'i' } },
          { 'uploadInfo.userId': { $regex: search, $options: 'i' } },
          { 'transcript.summary': { $regex: search, $options: 'i' } },
          { 'transcript.keywords': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Add date range filter
      if (dateFrom || dateTo) {
        filter['uploadInfo.uploadDate'] = {};
        if (dateFrom) {
          filter['uploadInfo.uploadDate'].$gte = dateFrom;
        }
        if (dateTo) {
          filter['uploadInfo.uploadDate'].$lte = dateTo;
        }
      }
      
      // Add status filter
      if (status) {
        filter['processingInfo.status'] = status;
      }
      
      // Add performance level filter
      if (performanceLevel) {
        filter['overallPerformance.performanceLevel'] = performanceLevel;
      }
      
      // Add language filter
      if (language) {
        filter['uploadInfo.language'] = language;
      }
      
      // Add duration range filter
      if (minDuration !== undefined || maxDuration !== undefined) {
        filter['uploadInfo.durationSeconds'] = {};
        if (minDuration !== undefined) {
          filter['uploadInfo.durationSeconds'].$gte = minDuration;
        }
        if (maxDuration !== undefined) {
          filter['uploadInfo.durationSeconds'].$lte = maxDuration;
        }
      }
      
      // Build sort object
      const sortField = sortBy === 'uploadDate' ? 'uploadInfo.uploadDate' : `uploadInfo.${sortBy}`;
      const sort: any = {};
      sort[sortField] = sortOrder === 'asc' ? 1 : -1;
      
      const documents = await collection.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return documents as VideoAnalysisDocument[];
    } catch (error) {
      console.error('❌ Error listing video analyses:', error);
      throw error;
    }
  }

  /**
   * Get count of video analyses with filtering
   */
  async getVideoAnalysisCount(accountId: string, options: {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    performanceLevel?: string;
    language?: string;
    minDuration?: number;
    maxDuration?: number;
    userId?: string;
    userRole?: string;
  } = {}): Promise<number> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const { 
        search = '', 
        dateFrom, 
        dateTo, 
        status,
        performanceLevel,
        language,
        minDuration,
        maxDuration,
        userId, 
        userRole 
      } = options;
      
      // Build query filter (same as in listVideoAnalyses)
      const filter: any = {
        'uploadInfo.accountId': accountId
      };
      
      // Add user filter for non-admin users
      if (userId && userRole) {
        // For employees, only show videos uploaded by themselves
        // userId now contains the full userId header (e.g., "EMPLOYEE:68d16f1bf7e35a47723c0540")
        filter['uploadInfo.userId'] = userId;
      }
      
      // Add search filter
      if (search) {
        filter.$or = [
          { 'uploadInfo.filename': { $regex: search, $options: 'i' } },
          { 'uploadInfo.userId': { $regex: search, $options: 'i' } },
          { 'transcript.summary': { $regex: search, $options: 'i' } },
          { 'transcript.keywords': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Add date range filter
      if (dateFrom || dateTo) {
        filter['uploadInfo.uploadDate'] = {};
        if (dateFrom) {
          filter['uploadInfo.uploadDate'].$gte = dateFrom;
        }
        if (dateTo) {
          filter['uploadInfo.uploadDate'].$lte = dateTo;
        }
      }
      
      // Add status filter
      if (status) {
        filter['processingInfo.status'] = status;
      }
      
      // Add performance level filter
      if (performanceLevel) {
        filter['overallPerformance.performanceLevel'] = performanceLevel;
      }
      
      // Add language filter
      if (language) {
        filter['uploadInfo.language'] = language;
      }
      
      // Add duration range filter
      if (minDuration !== undefined || maxDuration !== undefined) {
        filter['uploadInfo.durationSeconds'] = {};
        if (minDuration !== undefined) {
          filter['uploadInfo.durationSeconds'].$gte = minDuration;
        }
        if (maxDuration !== undefined) {
          filter['uploadInfo.durationSeconds'].$lte = maxDuration;
        }
      }
      
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error('❌ Error counting video analyses:', error);
      throw error;
    }
  }

  /**
   * Delete video analysis
   */
  async deleteVideoAnalysis(uploadId: string, accountId: string): Promise<boolean> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      const result = await collection.deleteOne({
        'uploadInfo.uploadId': uploadId,
        'uploadInfo.accountId': accountId
      });
      
      console.log(`✅ Video analysis deleted: ${result.deletedCount} document(s) removed`);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Error deleting video analysis:', error);
      throw error;
    }
  }

  /**
   * Initialize database indexes for performance
   */
  async createIndexes(): Promise<void> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      // Create indexes for better query performance
      await collection.createIndex({ 'uploadInfo.userId': 1, 'uploadInfo.uploadDate': -1 });
      await collection.createIndex({ 'uploadInfo.accountId': 1 });
      await collection.createIndex({ 'uploadInfo.uploadId': 1, 'uploadInfo.accountId': 1 }, { unique: true });
      await collection.createIndex({ 'overallPerformance.totalScore': -1 });
      await collection.createIndex({ 'processingInfo.status': 1 });
      await collection.createIndex({ 'metadata.createdAt': -1 });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * Find video analysis by timestamp (for older upload IDs)
   */
  async findByTimestamp(timestamp: string, accountId: string): Promise<VideoAnalysisDocument | null> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      // Convert timestamp to date range
      const timestampMs = parseInt(timestamp);
      const startDate = new Date(timestampMs - 1000); // 1 second before
      const endDate = new Date(timestampMs + 1000);   // 1 second after
      
      const document = await collection.findOne({
        'uploadInfo.accountId': accountId,
        'uploadInfo.uploadDate': {
          $gte: startDate,
          $lte: endDate
        }
      }) as unknown as VideoAnalysisDocument | null;
      
      if (document) {
        console.log(`✅ Found video analysis by timestamp: ${timestamp}`);
      }
      
      return document;
    } catch (error) {
      console.error('❌ Error finding by timestamp:', error);
      return null;
    }
  }

  /**
   * Find video analysis by partial uploadId match
   */
  async findByPartialId(partialId: string, accountId: string): Promise<VideoAnalysisDocument | null> {
    try {
      const collection = await getVideoAnalysisCollection();
      
      // Try to find uploadId that contains the partial ID
      const document = await collection.findOne({
        'uploadInfo.accountId': accountId,
        'uploadInfo.uploadId': { $regex: partialId, $options: 'i' }
      }) as unknown as VideoAnalysisDocument | null;
      
      if (document) {
        console.log(`✅ Found video analysis by partial ID: ${partialId}`);
      }
      
      return document;
    } catch (error) {
      console.error('❌ Error finding by partial ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const videoAnalysisService = new VideoAnalysisService();
