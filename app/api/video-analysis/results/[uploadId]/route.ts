/**
 * 📊 Video Analysis Results API - MongoDB Integration
 * Retrieves complete analysis results from uspeak-pro database
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
    
    console.log(`📊 Getting analysis results for Account: ${accountId}, Upload: ${uploadId}`);
    
    // Get complete video analysis from MongoDB (no fallback)
    const videoAnalysis = await videoAnalysisService.getVideoAnalysis(uploadId, accountId);
    
    if (!videoAnalysis) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis not found',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 404 });
    }
    
    // Check if analysis is complete
    const isComplete = videoAnalysis.processingInfo.status === 'completed';
    
    // Convert MongoDB format to Django format for frontend compatibility
    const djangoFormatResponse = convertMongoToDjangoFormat(videoAnalysis);
    
    // Calculate overall score for frontend compatibility
    const overallScore = calculateOverallScore(djangoFormatResponse);
    
    return NextResponse.json({
      success: true,
      data: djangoFormatResponse,
      score: overallScore,
      uploadId: uploadId,
      accountId: accountId,
      isComplete: isComplete
    });

  } catch (error) {
    console.error('❌ Analysis results error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get analysis results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    
    // Get account ID from headers
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    console.log(`🗑️ Deleting analysis for Account: ${accountId}, Upload: ${uploadId}`);
    
    // Delete from MongoDB
    const deleted = await videoAnalysisService.deleteVideoAnalysis(uploadId, accountId);
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis not found or already deleted',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Video analysis deleted successfully',
      uploadId: uploadId,
      accountId: accountId
    });

  } catch (error) {
    console.error('❌ Delete analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Calculate overall score from Django-formatted data
 */
function calculateOverallScore(djangoData: any): number {
  let score = 0;
  let count = 0;

  // Content Assessment Score (primary)
  if (djangoData.transcript?.content_assessment?.overall_strength) {
    score += djangoData.transcript.content_assessment.overall_strength;
    count++;
  }

  // Word Power Score
  if (djangoData.transcript?.content_assessment?.word_power_percentage) {
    score += djangoData.transcript.content_assessment.word_power_percentage;
    count++;
  }

  // Vocal score from audio data
  if (djangoData.poseAnalysis?.audio) {
    // Calculate vocal score similar to frontend logic
    const audio = djangoData.poseAnalysis.audio;
    const volumeDb = typeof audio.volume_db === 'number' ? audio.volume_db : NaN;
    const pitchHz = typeof audio.mean_pitch_hz === 'number' ? audio.mean_pitch_hz : NaN;
    const pauses = typeof audio.num_pauses === 'number' ? audio.num_pauses : NaN;
    
    // Volume score
    const volumeScore = isNaN(volumeDb) ? 0 : Math.max(0, Math.min(100, volumeDb + 60));
    
    // Pitch score
    let pitchScore = 0;
    if (!isNaN(pitchHz)) {
      const optimalCenter = 195;
      const deviation = Math.abs(pitchHz - optimalCenter);
      pitchScore = Math.max(0, Math.min(100, 100 - (deviation / optimalCenter) * 100));
      if (audio.pitch_range && /high|wide|good/i.test(audio.pitch_range)) {
        pitchScore = Math.max(0, Math.min(100, pitchScore + 5));
      }
    }
    
    // Pause score
    let pauseScore = 0;
    if (!isNaN(pauses)) {
      if (pauses === 0) pauseScore = 70;
      else if (pauses <= 2) pauseScore = 95;
      else if (pauses <= 4) pauseScore = 80;
      else if (pauses <= 7) pauseScore = 65;
      else pauseScore = 50;
    }
    
    const vocalScore = (volumeScore + pitchScore + pauseScore) / 3;
    score += vocalScore;
    count++;
  }

  // Sentiment Analysis Score
  if (djangoData.transcript?.sentiment_analysis?.confidence) {
    score += djangoData.transcript.sentiment_analysis.confidence;
    count++;
  }

  return count > 0 ? Math.round(score / count) : 0;
}

/**
 * Convert MongoDB schema format to Django format for frontend compatibility
 */
function convertMongoToDjangoFormat(mongoData: any) {
  return {
    // Convert transcript data to Django format
    transcript: {
      filename: mongoData.uploadInfo?.filename || '',
      file_size: formatFileSize(mongoData.uploadInfo?.fileSize || 0),
      language: mongoData.uploadInfo?.language || 'en',
      duration: mongoData.uploadInfo?.duration || '00:00:00',
      original_transcript: mongoData.transcript?.originalTranscript || '',
      corrected_transcript: mongoData.transcript?.correctedTranscript || '',
      summary: mongoData.transcript?.summary || '',
      keywords: mongoData.transcript?.keywords || '',
      word_count: mongoData.transcript?.wordCount || 0,
      sentences: mongoData.transcript?.sentences || 0,
      repeated_words: mongoData.wordPowerAnalysis?.repeatedWords || [],
      filler_words: mongoData.wordPowerAnalysis?.fillerWords || [],
      
      // Convert sentiment analysis
      sentiment_analysis: mongoData.sentimentAnalysis ? {
        overall_sentiment: mongoData.sentimentAnalysis.overallSentiment,
        positive_score: mongoData.sentimentAnalysis.positiveScore,
        negative_score: mongoData.sentimentAnalysis.negativeScore,
        neutral_score: mongoData.sentimentAnalysis.neutralScore,
        confidence: mongoData.sentimentAnalysis.confidence
      } : null,
      
      // Convert content assessment
      content_assessment: mongoData.wordPowerAnalysis ? {
        quality_score: mongoData.wordPowerAnalysis.contentAssessment?.qualityScore || 0,
        vocabulary_diversity: mongoData.wordPowerAnalysis.contentAssessment?.vocabularyDiversity || 0,
        clarity_score: mongoData.wordPowerAnalysis.contentAssessment?.clarityScore || 0,
        complexity_level: mongoData.wordPowerAnalysis.contentAssessment?.complexityLevel || 'medium',
        overall_strength: mongoData.wordPowerAnalysis.overallStrength || 0,
        strength_level: mongoData.wordPowerAnalysis.strengthLevel || 'average',
        strength_description: mongoData.wordPowerAnalysis.strengthDescription || '',
        top_strength: mongoData.wordPowerAnalysis.topStrength || '',
        key_improvement: mongoData.wordPowerAnalysis.keyImprovement || '',
        filler_words_percentage: mongoData.wordPowerAnalysis.contentAssessment?.fluency?.fillerWordsPercentage || 0,
        avg_words_per_sentence: mongoData.wordPowerAnalysis.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
        word_count: mongoData.transcript?.wordCount || 0,
        vocabulary_score: mongoData.wordPowerAnalysis.contentAssessment?.vocabularyScore || 0,
        vocabulary_description: `Vocabulary diversity: ${mongoData.wordPowerAnalysis.contentAssessment?.vocabularyDiversity || 0}%`,
        content_length_score: mongoData.wordPowerAnalysis.contentAssessment?.contentLength?.score || 0,
        content_length_description: mongoData.wordPowerAnalysis.contentAssessment?.contentLength?.description || '',
        fluency_score: mongoData.wordPowerAnalysis.contentAssessment?.fluency?.score || 0,
        fluency_description: mongoData.wordPowerAnalysis.contentAssessment?.fluency?.description || '',
        flow_description: mongoData.wordPowerAnalysis.contentAssessment?.flow?.description || '',
        word_power_score: mongoData.wordPowerAnalysis.overallScore || 0,
        word_power_percentage: ((mongoData.wordPowerAnalysis.overallScore || 0) / 100) * 100,
        overall_score: mongoData.wordPowerAnalysis.overallScore || 0
      } : null,
      
      // Convert strengths and improvements
      strengths_improvements: {
        strengths: mongoData.wordPowerAnalysis?.improvements?.map((item: string, index: number) => ({
          area: `Strength ${index + 1}`,
          description: item,
          score: 80
        })) || [],
        improvements: mongoData.wordPowerAnalysis?.improvements?.map((item: string, index: number) => ({
          area: `Improvement ${index + 1}`,
          description: item,
          score: 60
        })) || [],
        strength_score: mongoData.wordPowerAnalysis?.overallStrength || 0,
        improvement_areas_score: 60,
        detailed_metrics: {
          length_score: mongoData.wordPowerAnalysis?.contentAssessment?.contentLength?.score || 0,
          vocabulary_score: mongoData.wordPowerAnalysis?.contentAssessment?.vocabularyScore || 0,
          unique_word_ratio: mongoData.wordPowerAnalysis?.contentAssessment?.vocabularyDiversity || 0,
          fluency_score: mongoData.wordPowerAnalysis?.contentAssessment?.fluency?.score || 0,
          filler_word_percentage: mongoData.wordPowerAnalysis?.contentAssessment?.fluency?.fillerWordsPercentage || 0,
          sentence_score: mongoData.wordPowerAnalysis?.contentAssessment?.sentenceStructure?.score || 0,
          avg_sentence_length: mongoData.wordPowerAnalysis?.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
          sentence_count: mongoData.wordPowerAnalysis?.contentAssessment?.sentenceStructure?.sentenceCount || 0,
          transition_score: mongoData.wordPowerAnalysis?.contentAssessment?.flow?.score || 0,
          transition_word_count: mongoData.wordPowerAnalysis?.contentAssessment?.flow?.transitionWordCount || 0
        }
      },
      
      // Convert emotion analysis
      emotion_analysis: mongoData.emotionAnalysis ? {
        dominant_emotion: mongoData.emotionAnalysis.dominantEmotion,
        confidence: mongoData.emotionAnalysis.confidence,
        emotion_scores: mongoData.emotionAnalysis.emotionScores,
        detected_keywords: mongoData.emotionAnalysis.detectedKeywords
      } : null,
      
      // Convert confidence analysis
      confidence_analysis: mongoData.confidenceAnalysis ? {
        overall_confidence: mongoData.confidenceAnalysis.overallConfidence,
        confidence_level: mongoData.confidenceAnalysis.confidenceLevel,
        confidence_score: mongoData.confidenceAnalysis.confidenceScore,
        engagement_level: mongoData.confidenceAnalysis.engagementLevel,
        engagement_score: mongoData.confidenceAnalysis.engagementScore,
        nervousness_level: mongoData.confidenceAnalysis.nervousnessLevel,
        nervousness_score: mongoData.confidenceAnalysis.nervousnessScore,
        positive_indicators: mongoData.confidenceAnalysis.positiveIndicators,
        negative_indicators: mongoData.confidenceAnalysis.negativeIndicators,
        confidence_ratio: mongoData.confidenceAnalysis.confidenceRatio
      } : null
    },
    
    // Convert pose analysis data
    poseAnalysis: mongoData.bodyLanguageAnalysis || mongoData.vocalAnalysis ? {
      frames_processed: mongoData.bodyLanguageAnalysis?.framesProcessed || 0,
      smiles: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.smiles),
      head_moves: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.headMovement),
      hand_moves: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.handMovement),
      eye_contact: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.eyeContact),
      leg_moves: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.legMovement),
      foot_moves: formatGestureString(mongoData.bodyLanguageAnalysis?.gestures?.footMovement),
      
      // Convert audio data
      audio: mongoData.vocalAnalysis?.audio ? {
        duration_sec: mongoData.vocalAnalysis.audio.durationSec,
        volume_db: mongoData.vocalAnalysis.audio.volumeDb,
        mean_pitch_hz: mongoData.vocalAnalysis.audio.meanPitchHz,
        pitch_range: mongoData.vocalAnalysis.audio.pitchRange,
        num_pauses: mongoData.vocalAnalysis.audio.numPauses,
        spoken_duration_sec: mongoData.vocalAnalysis.audio.spokenDurationSec
      } : null
    } : null,
    
    // Convert coaching data
    coaching: mongoData.coachingFeedback ? {
      summary: mongoData.coachingFeedback.summary,
      interpretation: mongoData.coachingFeedback.bodyLanguageAnalysis || mongoData.coachingFeedback.recommendations
    } : null
  };
}

/**
 * Format file size to Django format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format gesture data to Django string format
 */
function formatGestureString(gestureData: any): string {
  if (!gestureData) return 'No data available';
  
  if (typeof gestureData === 'string') return gestureData;
  
  const count = gestureData.count || 0;
  const percentage = gestureData.percentage || 0;
  
  return `${count} detected (${percentage}%)`;
}
