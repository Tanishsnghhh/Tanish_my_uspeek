/**
 * 📊 Video Analysis Status API - MongoDB Integration
 * Real-time status updates for video processing pipeline
 * Account-based isolation for multi-tenant security
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    
    if (!uploadId) {
      return NextResponse.json({
        success: false,
        error: 'Missing uploadId parameter'
      }, { status: 400 });
    }
    
    // Get account ID from headers
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    console.log(`📊 Getting status for Account: ${accountId}, Upload: ${uploadId}`);
    
    // Get video analysis from MongoDB
    const videoAnalysis = await videoAnalysisService.getVideoAnalysis(uploadId, accountId);
    
    if (!videoAnalysis) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis not found',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 404 });
    }
    
    // Calculate completion status for each component
    const componentStatus = {
      transcription: {
        completed: !!videoAnalysis.transcript?.originalTranscript,
        progress: videoAnalysis.transcript?.originalTranscript ? 100 : 0
      },
      vocalAnalysis: {
        completed: !!videoAnalysis.vocalAnalysis,
        progress: videoAnalysis.vocalAnalysis ? 100 : 0
      },
      wordPowerAnalysis: {
        completed: !!videoAnalysis.wordPowerAnalysis,
        progress: videoAnalysis.wordPowerAnalysis ? 100 : 0
      },
      bodyLanguageAnalysis: {
        completed: !!videoAnalysis.bodyLanguageAnalysis,
        progress: videoAnalysis.bodyLanguageAnalysis ? 100 : 0
      },
      sentimentAnalysis: {
        completed: !!videoAnalysis.sentimentAnalysis,
        progress: videoAnalysis.sentimentAnalysis ? 100 : 0
      },
      emotionAnalysis: {
        completed: !!videoAnalysis.emotionAnalysis,
        progress: videoAnalysis.emotionAnalysis ? 100 : 0
      },
      confidenceAnalysis: {
        completed: !!videoAnalysis.confidenceAnalysis,
        progress: videoAnalysis.confidenceAnalysis ? 100 : 0
      },
      overallPerformance: {
        completed: !!videoAnalysis.overallPerformance,
        progress: videoAnalysis.overallPerformance ? 100 : 0
      },
      coachingFeedback: {
        completed: !!videoAnalysis.coachingFeedback,
        progress: videoAnalysis.coachingFeedback ? 100 : 0
      }
    };
    
    // Calculate estimated time remaining
    const currentProgress = videoAnalysis.processingInfo.progress;
    const estimatedTotalTime = 180; // 3 minutes in seconds
    const estimatedRemaining = Math.max(0, Math.round((estimatedTotalTime * (100 - currentProgress)) / 100));
    
    // Determine next expected step
    let nextStep = 'Unknown';
    if (!componentStatus.transcription.completed) {
      nextStep = 'Transcription';
    } else if (!componentStatus.vocalAnalysis.completed) {
      nextStep = 'Vocal Analysis';
    } else if (!componentStatus.wordPowerAnalysis.completed) {
      nextStep = 'Word Power Analysis';
    } else if (!componentStatus.bodyLanguageAnalysis.completed) {
      nextStep = 'Body Language Analysis';
    } else if (!componentStatus.overallPerformance.completed) {
      nextStep = 'Overall Performance Calculation';
    } else if (!componentStatus.coachingFeedback.completed) {
      nextStep = 'Coaching Feedback Generation';
    } else {
      nextStep = 'Complete';
    }
    
    // Return comprehensive status
    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      accountId: accountId,
      
      // Basic Information
      fileInfo: {
        filename: videoAnalysis.uploadInfo.filename,
        fileSize: videoAnalysis.uploadInfo.fileSize,
        duration: videoAnalysis.uploadInfo.duration,
        language: videoAnalysis.uploadInfo.language,
        uploadDate: videoAnalysis.uploadInfo.uploadDate
      },
      
      // Overall Progress
      overallProgress: {
        status: videoAnalysis.processingInfo.status,
        stage: videoAnalysis.processingInfo.stage,
        progress: videoAnalysis.processingInfo.progress,
        isComplete: videoAnalysis.processingInfo.status === 'completed',
        estimatedTimeRemaining: `${Math.floor(estimatedRemaining / 60)}:${(estimatedRemaining % 60).toString().padStart(2, '0')}`,
        nextStep: nextStep
      },
      
      // Component-wise Status
      componentStatus: componentStatus,
      
      // Processing Timeline
      timeline: [
        {
          step: 'Upload',
          status: 'completed',
          timestamp: videoAnalysis.uploadInfo.uploadDate,
          description: 'File uploaded successfully'
        },
        {
          step: 'Transcription',
          status: componentStatus.transcription.completed ? 'completed' : 
                  currentProgress >= 15 ? 'in_progress' : 'pending',
          timestamp: componentStatus.transcription.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Converting speech to text'
        },
        {
          step: 'Vocal Analysis',
          status: componentStatus.vocalAnalysis.completed ? 'completed' : 
                  currentProgress >= 40 ? 'in_progress' : 'pending',
          timestamp: componentStatus.vocalAnalysis.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Analyzing voice tone and delivery'
        },
        {
          step: 'Content Analysis',
          status: componentStatus.wordPowerAnalysis.completed ? 'completed' : 
                  currentProgress >= 60 ? 'in_progress' : 'pending',
          timestamp: componentStatus.wordPowerAnalysis.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Evaluating word choice and content quality'
        },
        {
          step: 'Body Language Analysis',
          status: componentStatus.bodyLanguageAnalysis.completed ? 'completed' : 
                  currentProgress >= 75 ? 'in_progress' : 'pending',
          timestamp: componentStatus.bodyLanguageAnalysis.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Analyzing gestures and posture'
        },
        {
          step: 'Overall Assessment',
          status: componentStatus.overallPerformance.completed ? 'completed' : 
                  currentProgress >= 90 ? 'in_progress' : 'pending',
          timestamp: componentStatus.overallPerformance.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Calculating final scores and recommendations'
        },
        {
          step: 'Report Generation',
          status: componentStatus.coachingFeedback.completed ? 'completed' : 
                  currentProgress >= 95 ? 'in_progress' : 'pending',
          timestamp: componentStatus.coachingFeedback.completed ? 
                     videoAnalysis.metadata.updatedAt : null,
          description: 'Generating personalized coaching feedback'
        }
      ],
      
      // Available Scores (if computed)
      scores: {
        ...(videoAnalysis.vocalAnalysis && {
          vocal: {
            score: videoAnalysis.vocalAnalysis.overallScore,
            outOfFive: videoAnalysis.vocalAnalysis.scoreOutOfFive,
            verdict: videoAnalysis.vocalAnalysis.verdict
          }
        }),
        ...(videoAnalysis.wordPowerAnalysis && {
          wordPower: {
            score: videoAnalysis.wordPowerAnalysis.overallScore,
            outOfFive: videoAnalysis.wordPowerAnalysis.scoreOutOfFive,
            strengthLevel: videoAnalysis.wordPowerAnalysis.strengthLevel
          }
        }),
        ...(videoAnalysis.bodyLanguageAnalysis && {
          bodyLanguage: {
            score: videoAnalysis.bodyLanguageAnalysis.overallScore,
            outOfFive: videoAnalysis.bodyLanguageAnalysis.scoreOutOfFive,
            verdict: videoAnalysis.bodyLanguageAnalysis.verdict
          }
        }),
        ...(videoAnalysis.overallPerformance && {
          overall: {
            score: videoAnalysis.overallPerformance.totalScore,
            performanceLevel: videoAnalysis.overallPerformance.performanceLevel,
            title: videoAnalysis.overallPerformance.title
          }
        })
      },
      
      // API Endpoints
      endpoints: {
        statusAPI: `/api/video-analysis/status/${uploadId}`,
        resultsAPI: `/api/video-analysis/results/${uploadId}`,
        transcribeAPI: `/api/video-analysis/transcribe`,
        analyzeAPI: `/api/video-analysis/analyze`
      },
      
      // Metadata
      metadata: {
        createdAt: videoAnalysis.metadata.createdAt,
        updatedAt: videoAnalysis.metadata.updatedAt,
        version: videoAnalysis.metadata.version,
        analysisVersion: videoAnalysis.processingInfo.analysisVersion
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
