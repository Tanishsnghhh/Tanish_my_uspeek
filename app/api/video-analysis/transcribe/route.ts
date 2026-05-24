/**
 * 📝 Transcription Update API - MongoDB Integration
 * Handles transcript updates from Django Whisper processing
 * Account-based isolation for multi-tenant security
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';

export async function POST(request: NextRequest) {
  try {
    
    // Get account ID from headers - CRITICAL for multi-tenant isolation
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    const data = await request.json();
    const { uploadId, transcriptionData } = data;
    
    if (!uploadId || !transcriptionData) {
      return NextResponse.json({
        success: false,
        error: 'Missing uploadId or transcriptionData'
      }, { status: 400 });
    }
    
    // Validate video analysis exists
    const videoAnalysis = await videoAnalysisService.getVideoAnalysis(uploadId, accountId);
    if (!videoAnalysis) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis not found',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 404 });
    }
    
    // Calculate derived metrics for comprehensive analysis
    const originalTranscript = transcriptionData.original_transcript || transcriptionData.transcript || '';
    const correctedTranscript = transcriptionData.corrected_transcript || originalTranscript;
    const wordCount = originalTranscript.split(' ').filter((word: string) => word.trim()).length;
    const sentences = originalTranscript.split('.').filter((s: string) => s.trim()).length;
    
    // Prepare comprehensive transcript update data matching schema
    const updateData = {
      // 📝 Transcript Data (complete section)
      transcript: {
        originalTranscript: originalTranscript,
        correctedTranscript: correctedTranscript,
        summary: transcriptionData.summary || '',
        keywords: transcriptionData.keywords || '',
        wordCount: transcriptionData.word_count || wordCount,
        sentences: transcriptionData.sentence_count || sentences
      },
      
      // 🎯 Upload Info Updates
      'uploadInfo.language': transcriptionData.language || 'en',
      'uploadInfo.duration': transcriptionData.duration_formatted || '00:00:00',
      'uploadInfo.durationSeconds': transcriptionData.duration_seconds || 0,
      
      // 🔄 Processing Info Updates
      'processingInfo.status': 'transcribing',
      'processingInfo.stage': 'transcription_complete',
      'processingInfo.progress': 25,
      'processingInfo.qualityFlags.transcriptionAccuracy': transcriptionData.confidence > 0.8 ? 'High' : 
                                                           transcriptionData.confidence > 0.6 ? 'Medium' : 'Low',
      
      // 🎤 Basic Vocal Analysis if available
      ...(transcriptionData.audio_info && {
        'vocalAnalysis.audio.durationSec': transcriptionData.audio_info.duration_sec || 0,
        'vocalAnalysis.audio.volumeDb': transcriptionData.audio_info.volume_db || 0,
        'vocalAnalysis.audio.meanPitchHz': transcriptionData.audio_info.mean_pitch_hz || 0,
        'vocalAnalysis.audio.pitchRange': transcriptionData.audio_info.pitch_range || '0-0 Hz',
        'vocalAnalysis.audio.numPauses': transcriptionData.audio_info.num_pauses || 0,
        'vocalAnalysis.audio.spokenDurationSec': transcriptionData.audio_info.spoken_duration_sec || 0
      }),
      
      // 💬 Basic Word Power Analysis if available  
      ...(transcriptionData.content_assessment && {
        'wordPowerAnalysis.contentAssessment.contentLength.wordCount': wordCount,
        'wordPowerAnalysis.contentAssessment.contentLength.score': Math.min(100, (wordCount / 300) * 100),
        'wordPowerAnalysis.contentAssessment.vocabularyDiversity': transcriptionData.content_assessment.vocabulary_diversity || 0,
        'wordPowerAnalysis.contentAssessment.qualityScore': transcriptionData.content_assessment.quality_score || 0
      }),
      
      // 😊 Sentiment Analysis if available
      ...(transcriptionData.sentiment_analysis && {
        sentimentAnalysis: {
          overallSentiment: transcriptionData.sentiment_analysis.overall_sentiment || 'neutral',
          confidence: transcriptionData.sentiment_analysis.confidence || 0,
          positiveScore: transcriptionData.sentiment_analysis.positive_score || 0,
          negativeScore: transcriptionData.sentiment_analysis.negative_score || 0,
          neutralScore: transcriptionData.sentiment_analysis.neutral_score || 0,
          label: transcriptionData.sentiment_analysis.label || 'neutral'
        }
      }),
      
      // Emotion Analysis if available
      ...(transcriptionData.emotion_analysis && {
        emotionAnalysis: {
          dominantEmotion: transcriptionData.emotion_analysis.dominant_emotion || 'No emotion detected',
          confidence: transcriptionData.emotion_analysis.confidence || 0,
          emotionScores: transcriptionData.emotion_analysis.emotion_scores || {},
          detectedKeywords: transcriptionData.emotion_analysis.detected_keywords || []
        }
      }),
      
      // 🔍 Metadata update
      'metadata.updatedAt': new Date()
    };    // Update MongoDB record
    const updated = await videoAnalysisService.updateAnalysisData(uploadId, accountId, updateData);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis update failed',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Transcription updated successfully',
      uploadId: uploadId,
      accountId: accountId,
      
            // 📝 Updated transcript info
      transcriptInfo: {
        originalTranscript: originalTranscript,
        correctedTranscript: correctedTranscript,
        summary: transcriptionData.summary || '',
        keywords: transcriptionData.keywords || '',
        wordCount: wordCount,
        sentences: sentences,
        language: transcriptionData.language || 'en'
      },
      
      // 🔄 Processing status
      processingInfo: {
        status: 'transcribing',
        stage: 'transcription_complete',
        progress: 25,
        qualityFlags: {
          transcriptionAccuracy: transcriptionData.confidence > 0.8 ? 'High' : 
                                 transcriptionData.confidence > 0.6 ? 'Medium' : 'Low'
        }
      },
      
      // 📊 Analysis preview (if available)
      analysisPreview: {
        hasVocalData: !!transcriptionData.audio_info,
        hasContentAssessment: !!transcriptionData.content_assessment,
        hasSentimentAnalysis: !!transcriptionData.sentiment_analysis,
        hasEmotionAnalysis: !!transcriptionData.emotion_analysis
      },
      
      // 🎯 Next steps
      nextSteps: {
        statusAPI: `/api/video-analysis/status/${uploadId}`,
        analysisAPI: `/api/video-analysis/analyze`,
        resultsAPI: `/api/video-analysis/results/${uploadId}`,
        bodyLanguageAPI: `/api/video-analysis/body-language`,
        vocalAnalysisAPI: `/api/video-analysis/vocal-analysis`
      }
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve current transcription
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
    
    // Return transcript data
    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      accountId: accountId,
      
      // Transcript information
      transcript: {
        originalTranscript: videoAnalysis.transcript?.originalTranscript || '',
        correctedTranscript: videoAnalysis.transcript?.correctedTranscript || '',
        summary: videoAnalysis.transcript?.summary || '',
        keywords: videoAnalysis.transcript?.keywords || '',
        wordCount: videoAnalysis.transcript?.wordCount || 0,
        sentences: videoAnalysis.transcript?.sentences || 0
      },
      
      // File information
      fileInfo: {
        filename: videoAnalysis.uploadInfo?.filename,
        duration: videoAnalysis.uploadInfo?.duration,
        language: videoAnalysis.uploadInfo?.language
      },
      
      // Processing status
      processingInfo: {
        status: videoAnalysis.processingInfo?.status,
        stage: videoAnalysis.processingInfo?.stage,
        progress: videoAnalysis.processingInfo?.progress
      }
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
