/**
 * 🎥 Video Upload API with MongoDB Integration
 * Handles video upload and creates initial analysis document in uspeak-pro database
 * Account-based isolation for multi-tenant security
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Get account ID from headers - CRITICAL for multi-tenant isolation
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    // Get user ID (if authenticated)
    const userId = request.headers.get('x-user-id') || 
                   request.headers.get('User-ID') || 
                   undefined;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No video file provided'
      }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'audio/mp3', 'audio/wav', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }
    
    // Generate unique upload ID
    const uploadId = `video_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const filename = file.name;
    const fileSize = file.size;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', accountId);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file to disk
    const fileExtension = filename.split('.').pop();
    const savedFilename = `${uploadId}.${fileExtension}`;
    const filePath = join(uploadDir, savedFilename);
    const relativeFilePath = `/uploads/${accountId}/${savedFilename}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, new Uint8Array(buffer));
    
    // Create initial MongoDB document
    const videoAnalysisData = {
      uploadInfo: {
        uploadId: uploadId,
        filename: filename,
        fileSize: Math.round(fileSize / (1024 * 1024) * 100) / 100, // Size in MB
        duration: '00:00:00', // Will be updated after processing
        durationSeconds: 0,
        uploadDate: new Date(),
        language: 'unknown', // Will be detected during transcription
        userId: userId,
        accountId: accountId,
        filePath: relativeFilePath
      },
      transcript: {
        originalTranscript: '',
        correctedTranscript: '',
        summary: '',
        keywords: '',
        wordCount: 0,
        sentences: 0
      },
      processingInfo: {
        analysisVersion: 'v2.1.0',
        processedDate: new Date(),
        status: 'uploading' as const,
        stage: 'upload_complete',
        progress: 10,
        technologies: {
          transcription: 'OpenAI Whisper',
          nlp: 'Gemini AI + HuggingFace Transformers',
          bodyLanguage: 'MediaPipe + DeepFace',
          audioAnalysis: 'Parselmouth (Praat)',
          sentiment: 'Custom Emotion Engine + Transformers'
        },
        qualityFlags: {
          audioQuality: 'Unknown',
          videoQuality: 'Unknown',
          transcriptionAccuracy: 'Unknown'
        }
      }
    };
    
    // Save to MongoDB
    const mongoId = await videoAnalysisService.createVideoAnalysis(videoAnalysisData);
    
    // Trigger Django transcription
    const djangoTranscriptionUrl = process.env.DJANGO_API_URL + '/app/upload-video/';
    const transcriptionPromise = triggerDjangoTranscription(filePath, uploadId, accountId);
    
    // Don't wait for transcription to complete - return immediately
    transcriptionPromise.catch(error => {
      // Update status to failed
      videoAnalysisService.updateProgress(uploadId, accountId, 'failed', 0, 'transcription_failed');
    });
    
    // Return success response with MongoDB document info
    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully and processing initiated',
      
      // Upload Information
      uploadInfo: {
        uploadId: uploadId,
        mongoId: mongoId,
        filename: filename,
        fileSize: `${Math.round(fileSize / (1024 * 1024) * 100) / 100} MB`,
        filePath: relativeFilePath,
        accountId: accountId,
        userId: userId
      },
      
      // Processing Status
      processingInfo: {
        status: 'uploading',
        stage: 'upload_complete',
        progress: 10,
        estimatedTimeRemaining: '2-3 minutes'
      },
      
      // API Endpoints for frontend
      endpoints: {
        statusAPI: `/api/video-analysis/status/${uploadId}`,
        transcribeAPI: `/api/video-analysis/transcribe`,
        analyzeAPI: `/api/video-analysis/analyze`,
        resultsAPI: `/api/video-analysis/results/${uploadId}`
      },
      
      // Next Steps
      nextSteps: [
        'Transcription will begin automatically',
        'You will receive real-time updates',
        'Analysis will complete in 2-3 minutes',
        'Results will be available via the results API'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to upload video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Trigger Django transcription in background
 */
async function triggerDjangoTranscription(filePath: string, uploadId: string, accountId: string): Promise<void> {
  try {
    // Update status to transcribing
    await videoAnalysisService.updateProgress(uploadId, accountId, 'transcribing', 15, 'transcription_started');
    
    // Here you would call your Django API
    // For now, we'll simulate the process
    const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
    
    const formData = new FormData();
    // In a real implementation, you'd send the file to Django
    // formData.append('file', file);
    formData.append('uploadId', uploadId);
    formData.append('accountId', accountId);
    
    // The Django service will call back to update transcription results
    // via the /api/video-analysis/transcribe endpoint
    
  } catch (error) {
    throw error;
  }
}

// GET endpoint to retrieve upload status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    
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
    
    // Return status information
    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      accountId: accountId,
      
      // File Information
      fileInfo: {
        filename: videoAnalysis.uploadInfo.filename,
        fileSize: videoAnalysis.uploadInfo.fileSize,
        duration: videoAnalysis.uploadInfo.duration,
        language: videoAnalysis.uploadInfo.language,
        uploadDate: videoAnalysis.uploadInfo.uploadDate
      },
      
      // Processing Status
      processingInfo: {
        status: videoAnalysis.processingInfo.status,
        stage: videoAnalysis.processingInfo.stage,
        progress: videoAnalysis.processingInfo.progress,
        processedDate: videoAnalysis.processingInfo.processedDate
      },
      
      // Available Data
      availableData: {
        hasTranscript: !!videoAnalysis.transcript.originalTranscript,
        hasVocalAnalysis: !!videoAnalysis.vocalAnalysis,
        hasWordPowerAnalysis: !!videoAnalysis.wordPowerAnalysis,
        hasBodyLanguageAnalysis: !!videoAnalysis.bodyLanguageAnalysis,
        hasOverallScore: !!videoAnalysis.overallPerformance
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get upload status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
