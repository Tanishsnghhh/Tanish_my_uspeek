import { NextRequest, NextResponse } from 'next/server';
import { getVideoAnalysisCollection } from '@/lib/database';

// Comprehensive type definitions for the report data
interface ComprehensiveAnalysisReport {
  analysisData: {
    filename: string;
    file_size: string;
    language: string;
    duration: string;
    upload_date?: string;
    speaker?: string;
    video_type?: string;
    talking_to?: string;
    hands_legs_visible?: string;
    created_date?: string;
    created_time?: string;
    overall_performance_score?: string;
    body_language_score?: string;
    vocal_tone_score?: string;
    word_power_score?: string;
    original_transcript: string;
    corrected_transcript: string;
    summary: string;
    keywords: string;
    content_assessment?: {
      word_power_score: number;
      word_power_percentage: number;
      overall_strength: number | string;
      strength_level: string;
      strength_description: string;
      top_strength: string;
      vocabulary_diversity: number;
      clarity_score: number;
      fluency_score: number;
      word_count: number;
      avg_words_per_sentence: number;
      sentence_count: number;
      unique_words_count?: number;
      text_sentiment?: string;
      text_sentiment_percent?: number;
      i_usage_percent?: number;
      sentence_length_avg?: number;
      keywords_list?: string[];
      pet_words?: any[];
      filler_words_list?: any[];
      word_power_top_areas?: string[];
      word_power_improvement_areas?: string[];
    };
    sentiment_analysis?: {
      overall_sentiment: string;
      confidence: number;
      positive_score: number;
      negative_score: number;
      neutral_score: number;
      label?: string;
    };
    emotion_analysis?: {
      dominant_emotion: string;
      confidence: number;
      emotion_scores: Record<string, number>;
      detected_keywords: any[];
    };
    confidence_analysis?: {
      overall_confidence: number | string;
      confidence_level: string;
      confidence_score: number;
      engagement_level: string;
      engagement_score: number;
      nervousness_level: string;
      nervousness_score: number;
      positive_indicators: number;
      negative_indicators: number;
      confidence_ratio: number;
    };
    repeated_words?: any[];
    filler_words?: any[];
    strengths_improvements?: {
      strengths: string[];
      improvements: string[];
    };
  };
  vocalData?: {
    audio: {
      duration_sec: number;
      volume_db: number;
      mean_pitch_hz: number;
      pitch_range: string;
      num_pauses: number;
      spoken_duration_sec: number;
    };
    overallScore: number;
    scoreOutOfFive?: number;
    verdict: string;
    rate_of_speech?: number;
    modulation_level?: string;
    average_pitch?: number;
    average_volume?: number;
    pace: {
      wordsPerMinute: number;
      assessment: string;
    };
    clarity: {
      score: number;
      assessment: string;
    };
    quality: {
      energy: string;
      modulation: number;
      projection: string;
    };
    strengths: string[];
    improvements: string[];
    vocal_tone_top_areas?: string[];
    vocal_tone_improvement_areas?: string[];
  };
  bodyLanguageData?: {
    frames_processed: number;
    smiles: string;
    head_moves: string;
    hand_moves: string;
    eye_contact: string;
    leg_moves: string;
    foot_moves: string;
    overallScore: number;
    scoreOutOfFive?: number;
    processingDuration?: number | string;
    positive_facial_emotions?: string;
    calm_percent?: string;
    eye_contact_percent?: number;
    smile_count?: number;
    hands_used?: string;
    weight_balanced_on_both_leg_percent?: string;
    weight_on_one_leg_percent?: string;
    head_movement_percent?: number;
    leg_movement_percent?: number;
    hands_crossed_percent?: string;
    wrist_closed_percent?: string;
    anger_percent?: number;
    confused_percent?: number;
    fear_percent?: number;
    sad_percent?: number;
    body_language_top_areas?: string[];
    body_language_improvement_areas?: string[];
  };
  coachingData?: {
    summary: string;
    bodyLanguageAnalysis: string;
    vocalAnalysis: string;
    recommendations: string;
    practiceExercises: string[];
    quickWins: string[];
  };
  userData?: {
    name: string;
    email?: string;
    role?: string;
    department?: string;
    employeeId?: string;
    position?: string;
  };
}

// Direct MongoDB fetch function for specific fields
async function fetchVideoAnalysisFromMongoDB(uploadId: string) {
  try {
    const collection = await getVideoAnalysisCollection();

    // Fetch only the specific fields we need from MongoDB
    const document = await collection.findOne(
      {
        'uploadInfo.uploadId': uploadId
      },
      {
        projection: {
          // Video Details
          'uploadInfo.filename': 1,
          'uploadInfo.fileSize': 1,
          'uploadInfo.duration': 1,
          'uploadInfo.language': 1,
          'uploadInfo.uploadDate': 1,
          'uploadInfo.userId': 1,

          // Additional video metadata
          'metadata.video_type': 1,
          'metadata.talking_to': 1,
          'metadata.hands_legs_visible': 1,
          'metadata.created_date': 1,
          'metadata.created_time': 1,

          // Transcript Data
          'transcript.originalTranscript': 1,
          'transcript.correctedTranscript': 1,
          'transcript.summary': 1,
          'transcript.keywords': 1,
          'transcript.wordCount': 1,

          // Overall Scores
          'overallPerformance.totalScore': 1,
          'overallPerformance.vocalScore': 1,
          'overallPerformance.wordScore': 1,
          'overallPerformance.bodyScore': 1,

          // Body Language Analysis
          'bodyLanguageAnalysis.overallScore': 1,
          'bodyLanguageAnalysis.scoreOutOfFive': 1,
          'bodyLanguageAnalysis.framesProcessed': 1,
          'bodyLanguageAnalysis.processingDuration': 1,
          'bodyLanguageAnalysis.gestures.smiles': 1,
          'bodyLanguageAnalysis.gestures.headMovement': 1,
          'bodyLanguageAnalysis.gestures.handMovement': 1,
          'bodyLanguageAnalysis.gestures.eyeContact': 1,
          'bodyLanguageAnalysis.gestures.legMovement': 1,
          'bodyLanguageAnalysis.gestures.footMovement': 1,
          'bodyLanguageAnalysis.posture.straightPosture': 1,
          'bodyLanguageAnalysis.posture.shoulderPosition': 1,
          'bodyLanguageAnalysis.posture.stability': 1,
          'bodyLanguageAnalysis.posture.confidence': 1,
          'bodyLanguageAnalysis.topAreas': 1,
          'bodyLanguageAnalysis.improvements': 1,
          'bodyLanguageAnalysis.verdict': 1,

          // Vocal Tone Analysis
          'vocalAnalysis.overallScore': 1,
          'vocalAnalysis.scoreOutOfFive': 1,
          'vocalAnalysis.audio.durationSec': 1,
          'vocalAnalysis.audio.volumeDb': 1,
          'vocalAnalysis.audio.meanPitchHz': 1,
          'vocalAnalysis.audio.pitchRange': 1,
          'vocalAnalysis.audio.numPauses': 1,
          'vocalAnalysis.audio.spokenDurationSec': 1,
          'vocalAnalysis.audio.speakingTimePercentage': 1,
          'vocalAnalysis.quality.energy': 1,
          'vocalAnalysis.quality.modulation': 1,
          'vocalAnalysis.quality.projection': 1,
          'vocalAnalysis.quality.clarity': 1,
          'vocalAnalysis.quality.fluency': 1,
          'vocalAnalysis.strengths': 1,
          'vocalAnalysis.improvements': 1,
          'vocalAnalysis.verdict': 1,

          // Word Power Analysis
          'wordPowerAnalysis.overallScore': 1,
          'wordPowerAnalysis.scoreOutOfFive': 1,
          'wordPowerAnalysis.contentAssessment.vocabularyDiversity': 1,
          'wordPowerAnalysis.contentAssessment.vocabularyScore': 1,
          'wordPowerAnalysis.contentAssessment.clarityScore': 1,
          'wordPowerAnalysis.contentAssessment.fluency.score': 1,
          'wordPowerAnalysis.contentAssessment.fluency.fillerWordsPercentage': 1,
          'wordPowerAnalysis.contentAssessment.sentenceStructure.avgWordsPerSentence': 1,
          'wordPowerAnalysis.contentAssessment.sentenceStructure.sentenceCount': 1,
          'wordPowerAnalysis.contentAssessment.contentLength.wordCount': 1,
          'wordPowerAnalysis.contentAssessment.qualityScore': 1,
          'wordPowerAnalysis.overallStrength': 1,
          'wordPowerAnalysis.strengthLevel': 1,
          'wordPowerAnalysis.strengthDescription': 1,
          'wordPowerAnalysis.topStrength': 1,
          'wordPowerAnalysis.fillerWords': 1,
          'wordPowerAnalysis.repeatedWords': 1,
          'wordPowerAnalysis.improvements': 1,

          // Sentiment Analysis
          'sentimentAnalysis.overallSentiment': 1,
          'sentimentAnalysis.confidence': 1,
          'sentimentAnalysis.positiveScore': 1,
          'sentimentAnalysis.negativeScore': 1,
          'sentimentAnalysis.neutralScore': 1,
          'sentimentAnalysis.label': 1,

          // Emotion Analysis
          'emotionAnalysis.dominantEmotion': 1,
          'emotionAnalysis.confidence': 1,
          'emotionAnalysis.emotionScores': 1,
          'emotionAnalysis.detectedKeywords': 1,

          // Confidence Analysis
          'confidenceAnalysis.overallConfidence': 1,
          'confidenceAnalysis.confidenceLevel': 1,
          'confidenceAnalysis.confidenceScore': 1,
          'confidenceAnalysis.engagementLevel': 1,
          'confidenceAnalysis.engagementScore': 1,
          'confidenceAnalysis.nervousnessLevel': 1,
          'confidenceAnalysis.nervousnessScore': 1,
          'confidenceAnalysis.positiveIndicators': 1,
          'confidenceAnalysis.negativeIndicators': 1,
          'confidenceAnalysis.confidenceRatio': 1,

          // Overall Performance
          'overallPerformance.strengths': 1,
          'overallPerformance.improvements': 1,

          // Coaching Feedback
          'coachingFeedback.summary': 1,
          'coachingFeedback.bodyLanguageAnalysis': 1,
          'coachingFeedback.vocalAnalysis': 1,
          'coachingFeedback.recommendations': 1,
          'coachingFeedback.practiceExercises': 1,
          'coachingFeedback.quickWins': 1,

          // Metadata
          'metadata.createdAt': 1,
          'metadata.updatedAt': 1
        }
      }
    );

    return document;
  } catch (error) {
    console.error('❌ Error fetching from MongoDB:', error);
    throw error;
  }
}

// POST /api/video-analysis/export-pdf
export async function POST(request: NextRequest) {
  try {
    console.log('📄 Starting PDF export process...');

    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      console.error('❌ Upload ID is required');
      return NextResponse.json(
        { success: false, error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // No authentication required - direct access to MongoDB data

    // Fetch video analysis data directly from MongoDB with specific fields
    console.log('🔍 Fetching video analysis data from MongoDB for uploadId:', uploadId);
    
    let videoAnalysis = await fetchVideoAnalysisFromMongoDB(uploadId);

    if (!videoAnalysis) {
      console.error('❌ Video analysis not found for uploadId:', uploadId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Video analysis not found',
          details: `No data found for uploadId: ${uploadId}. Please verify the upload ID is correct and try again.`
        },
        { status: 404 }
      );
    }

    console.log('✅ Video analysis data retrieved successfully from MongoDB');

    // Build comprehensive report data structure from MongoDB fields
    const comprehensiveReport: ComprehensiveAnalysisReport = {
      analysisData: {
        filename: videoAnalysis.uploadInfo?.filename || 'Unknown',
        file_size: formatFileSize(videoAnalysis.uploadInfo?.fileSize || 0),
        language: videoAnalysis.uploadInfo?.language || 'Unknown',
        duration: videoAnalysis.uploadInfo?.duration || '00:00',
        upload_date: videoAnalysis.uploadInfo?.uploadDate?.toISOString() || new Date().toISOString(),
        speaker: videoAnalysis.uploadInfo?.userId || 'Unknown Speaker',

        // Additional video metadata
        video_type: videoAnalysis.metadata?.video_type || 'General Presentation',
        talking_to: videoAnalysis.metadata?.talking_to || 'Audience',
        hands_legs_visible: videoAnalysis.metadata?.hands_legs_visible || 'Not specified',
        created_date: videoAnalysis.metadata?.created_date || new Date().toLocaleDateString(),
        created_time: videoAnalysis.metadata?.created_time || new Date().toLocaleTimeString(),

        // Overall Scores
        overall_performance_score: videoAnalysis.overallPerformance?.totalScore ?
          `${videoAnalysis.overallPerformance.totalScore}/5` : 'N/A',
        body_language_score: videoAnalysis.bodyLanguageAnalysis?.scoreOutOfFive ?
          `${videoAnalysis.bodyLanguageAnalysis.scoreOutOfFive}/5` : 'N/A',
        vocal_tone_score: videoAnalysis.vocalAnalysis?.scoreOutOfFive ?
          `${videoAnalysis.vocalAnalysis.scoreOutOfFive}/5` : 'N/A',
        word_power_score: videoAnalysis.wordPowerAnalysis?.scoreOutOfFive ?
          `${videoAnalysis.wordPowerAnalysis.scoreOutOfFive}/5` : 'N/A',

        original_transcript: videoAnalysis.transcript?.originalTranscript || '',
        corrected_transcript: videoAnalysis.transcript?.correctedTranscript || '',
        summary: videoAnalysis.transcript?.summary || '',
        keywords: videoAnalysis.transcript?.keywords || '',

        // Content Assessment from Word Power Analysis
        content_assessment: videoAnalysis.wordPowerAnalysis ? {
          word_power_score: videoAnalysis.wordPowerAnalysis.overallScore || 0,
          word_power_percentage: (videoAnalysis.wordPowerAnalysis.scoreOutOfFive || 0) * 20,
          overall_strength: videoAnalysis.wordPowerAnalysis.overallStrength || 0,
          strength_level: videoAnalysis.wordPowerAnalysis.strengthLevel || 'Unknown',
          strength_description: videoAnalysis.wordPowerAnalysis.strengthDescription || '',
          top_strength: videoAnalysis.wordPowerAnalysis.topStrength || '',
          vocabulary_diversity: videoAnalysis.wordPowerAnalysis.contentAssessment?.vocabularyDiversity || 0,
          clarity_score: videoAnalysis.wordPowerAnalysis.contentAssessment?.clarityScore || 0,
          fluency_score: videoAnalysis.wordPowerAnalysis.contentAssessment?.fluency?.score || 0,
          word_count: videoAnalysis.wordPowerAnalysis.contentAssessment?.contentLength?.wordCount || videoAnalysis.transcript?.wordCount || 0,
          avg_words_per_sentence: videoAnalysis.wordPowerAnalysis.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
          sentence_count: videoAnalysis.wordPowerAnalysis.contentAssessment?.sentenceStructure?.sentenceCount || 0,

          // Additional word power fields
          unique_words_count: videoAnalysis.wordPowerAnalysis.contentAssessment?.vocabularyDiversity ?
            Math.round((videoAnalysis.wordPowerAnalysis.contentAssessment.vocabularyDiversity / 100) * (videoAnalysis.transcript?.wordCount || 0)) : 0,
          text_sentiment: videoAnalysis.sentimentAnalysis?.overallSentiment || 'Neutral',
          text_sentiment_percent: videoAnalysis.sentimentAnalysis?.confidence || 0,
          i_usage_percent: videoAnalysis.wordPowerAnalysis.fillerWords?.find((word: any) => word.word.toLowerCase() === 'i')?.percentage || 0,
          sentence_length_avg: videoAnalysis.wordPowerAnalysis.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
          keywords_list: videoAnalysis.transcript?.keywords ? videoAnalysis.transcript.keywords.split(',').map((k: string) => k.trim()) : [],
          pet_words: videoAnalysis.wordPowerAnalysis.repeatedWords?.slice(0, 5) || [],
          filler_words_list: videoAnalysis.wordPowerAnalysis.fillerWords?.slice(0, 5) || [],

          // Word power top areas and improvements
          word_power_top_areas: videoAnalysis.wordPowerAnalysis.strengths || [],
          word_power_improvement_areas: videoAnalysis.wordPowerAnalysis.improvements || [],
        } : undefined,

        // Sentiment Analysis
        sentiment_analysis: videoAnalysis.sentimentAnalysis ? {
          overall_sentiment: videoAnalysis.sentimentAnalysis.overallSentiment || 'Neutral',
          confidence: videoAnalysis.sentimentAnalysis.confidence || 0,
          positive_score: videoAnalysis.sentimentAnalysis.positiveScore || 0,
          negative_score: videoAnalysis.sentimentAnalysis.negativeScore || 0,
          neutral_score: videoAnalysis.sentimentAnalysis.neutralScore || 0,
          label: videoAnalysis.sentimentAnalysis.label || '',
        } : undefined,

        // Emotion Analysis
        emotion_analysis: videoAnalysis.emotionAnalysis ? {
          dominant_emotion: videoAnalysis.emotionAnalysis.dominantEmotion || 'Neutral',
          confidence: videoAnalysis.emotionAnalysis.confidence || 0,
          emotion_scores: videoAnalysis.emotionAnalysis.emotionScores || {},
          detected_keywords: videoAnalysis.emotionAnalysis.detectedKeywords || [],
        } : undefined,

        // Confidence Analysis
        confidence_analysis: videoAnalysis.confidenceAnalysis ? {
          overall_confidence: videoAnalysis.confidenceAnalysis.overallConfidence || 0,
          confidence_level: videoAnalysis.confidenceAnalysis.confidenceLevel || 'Unknown',
          confidence_score: videoAnalysis.confidenceAnalysis.confidenceScore || 0,
          engagement_level: videoAnalysis.confidenceAnalysis.engagementLevel || 'Unknown',
          engagement_score: videoAnalysis.confidenceAnalysis.engagementScore || 0,
          nervousness_level: videoAnalysis.confidenceAnalysis.nervousnessLevel || 'Unknown',
          nervousness_score: videoAnalysis.confidenceAnalysis.nervousnessScore || 0,
          positive_indicators: videoAnalysis.confidenceAnalysis.positiveIndicators || 0,
          negative_indicators: videoAnalysis.confidenceAnalysis.negativeIndicators || 0,
          confidence_ratio: videoAnalysis.confidenceAnalysis.confidenceRatio || 0,
        } : undefined,

        // Repeated and Filler Words
        repeated_words: videoAnalysis.wordPowerAnalysis?.repeatedWords || [],
        filler_words: videoAnalysis.wordPowerAnalysis?.fillerWords || [],

        // Strengths and Improvements
        strengths_improvements: videoAnalysis.overallPerformance ? {
          strengths: videoAnalysis.overallPerformance.strengths || [],
          improvements: videoAnalysis.overallPerformance.improvements || [],
        } : undefined,
      },

      // Vocal Data
      vocalData: videoAnalysis.vocalAnalysis ? {
        audio: {
          duration_sec: videoAnalysis.vocalAnalysis.audio?.durationSec || 0,
          volume_db: videoAnalysis.vocalAnalysis.audio?.volumeDb || 0,
          mean_pitch_hz: videoAnalysis.vocalAnalysis.audio?.meanPitchHz || 0,
          pitch_range: videoAnalysis.vocalAnalysis.audio?.pitchRange || 'Unknown',
          num_pauses: videoAnalysis.vocalAnalysis.audio?.numPauses || 0,
          spoken_duration_sec: videoAnalysis.vocalAnalysis.audio?.spokenDurationSec || 0,
        },
        overallScore: videoAnalysis.vocalAnalysis.overallScore || 0,
        scoreOutOfFive: videoAnalysis.vocalAnalysis.scoreOutOfFive || 0,
        verdict: videoAnalysis.vocalAnalysis.verdict || 'Unknown',

        // Additional vocal analysis fields
        rate_of_speech: videoAnalysis.vocalAnalysis.audio && videoAnalysis.transcript?.wordCount ?
          Math.round((videoAnalysis.transcript.wordCount / videoAnalysis.vocalAnalysis.audio.spokenDurationSec) * 60) : 0,
        modulation_level: videoAnalysis.vocalAnalysis.quality?.modulation ?
          (videoAnalysis.vocalAnalysis.quality.modulation >= 80 ? 'High' :
           videoAnalysis.vocalAnalysis.quality.modulation >= 60 ? 'Medium' : 'Low') : 'Unknown',
        average_pitch: videoAnalysis.vocalAnalysis.audio?.meanPitchHz || 0,
        average_volume: videoAnalysis.vocalAnalysis.audio?.volumeDb || 0,

        pace: videoAnalysis.vocalAnalysis.audio && videoAnalysis.transcript?.wordCount ?
          {
            wordsPerMinute: Math.round((videoAnalysis.transcript.wordCount / videoAnalysis.vocalAnalysis.audio.spokenDurationSec) * 60),
            assessment: 'Calculated from audio data',
          } : {
            wordsPerMinute: 0,
            assessment: 'No audio data available',
          },
        clarity: videoAnalysis.vocalAnalysis.quality ? {
          score: videoAnalysis.vocalAnalysis.quality.clarity || 0,
          assessment: videoAnalysis.vocalAnalysis.quality.clarity >= 80 ? 'Excellent' :
                     videoAnalysis.vocalAnalysis.quality.clarity >= 60 ? 'Good' : 'Needs Improvement',
        } : {
          score: 0,
          assessment: 'No clarity data available',
        },
        quality: videoAnalysis.vocalAnalysis.quality ? {
          energy: videoAnalysis.vocalAnalysis.quality.energy || 'Unknown',
          modulation: videoAnalysis.vocalAnalysis.quality.modulation || 0,
          projection: videoAnalysis.vocalAnalysis.quality.projection || 'Unknown',
        } : {
          energy: 'Unknown',
          modulation: 0,
          projection: 'Unknown',
        },
        strengths: videoAnalysis.vocalAnalysis.strengths || [],
        improvements: videoAnalysis.vocalAnalysis.improvements || [],

        // Vocal tone top areas and improvements
        vocal_tone_top_areas: videoAnalysis.vocalAnalysis.strengths || [],
        vocal_tone_improvement_areas: videoAnalysis.vocalAnalysis.improvements || [],
      } : undefined,

      // Body Language Data
      bodyLanguageData: videoAnalysis.bodyLanguageAnalysis ? {
        frames_processed: videoAnalysis.bodyLanguageAnalysis.framesProcessed || 0,
        smiles: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.smiles),
        head_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.headMovement),
        hand_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.handMovement),
        eye_contact: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.eyeContact),
        leg_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.legMovement),
        foot_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.footMovement),
        overallScore: videoAnalysis.bodyLanguageAnalysis.overallScore || 0,
        scoreOutOfFive: videoAnalysis.bodyLanguageAnalysis.scoreOutOfFive || 0,
        processingDuration: videoAnalysis.bodyLanguageAnalysis.processingDuration || 'Unknown',

        // Additional body language fields
        positive_facial_emotions: videoAnalysis.bodyLanguageAnalysis.gestures?.smiles?.percentage ?
          `${videoAnalysis.bodyLanguageAnalysis.gestures.smiles.percentage}%` : '0%',
        calm_percent: videoAnalysis.bodyLanguageAnalysis.posture?.stability ?
          `${videoAnalysis.bodyLanguageAnalysis.posture.stability}%` : '0%',
        eye_contact_percent: videoAnalysis.bodyLanguageAnalysis.gestures?.eyeContact?.percentage || 0,
        smile_count: videoAnalysis.bodyLanguageAnalysis.gestures?.smiles?.count || 0,
        hands_used: videoAnalysis.bodyLanguageAnalysis.gestures?.handMovement?.description || 'Not detected',
        weight_balanced_on_both_leg_percent: videoAnalysis.bodyLanguageAnalysis.posture?.straightPosture ?
          `${videoAnalysis.bodyLanguageAnalysis.posture.straightPosture}%` : '0%',
        weight_on_one_leg_percent: videoAnalysis.bodyLanguageAnalysis.posture?.shoulderPosition ?
          `${100 - videoAnalysis.bodyLanguageAnalysis.posture.shoulderPosition}%` : '0%',

        // Head & Limb Movement
        head_movement_percent: videoAnalysis.bodyLanguageAnalysis.gestures?.headMovement?.percentage || 0,
        leg_movement_percent: videoAnalysis.bodyLanguageAnalysis.gestures?.legMovement?.percentage || 0,
        hands_crossed_percent: videoAnalysis.bodyLanguageAnalysis.gestures?.handMovement?.percentage ?
          `${100 - videoAnalysis.bodyLanguageAnalysis.gestures.handMovement.percentage}%` : '0%',
        wrist_closed_percent: videoAnalysis.bodyLanguageAnalysis.gestures?.handMovement?.effectiveness ?
          `${videoAnalysis.bodyLanguageAnalysis.gestures.handMovement.effectiveness}%` : '0%',

        // Top Negative Emotions (from emotion analysis)
        anger_percent: videoAnalysis.emotionAnalysis?.emotionScores?.anger || 0,
        confused_percent: videoAnalysis.emotionAnalysis?.emotionScores?.fear || 0, // Using fear as proxy for confusion
        fear_percent: videoAnalysis.emotionAnalysis?.emotionScores?.fear || 0,
        sad_percent: videoAnalysis.emotionAnalysis?.emotionScores?.sadness || 0,

        // Top areas and improvements
        body_language_top_areas: videoAnalysis.bodyLanguageAnalysis.topAreas || [],
        body_language_improvement_areas: videoAnalysis.bodyLanguageAnalysis.improvements || [],
      } : undefined,

      // Coaching Data
      coachingData: videoAnalysis.coachingFeedback ? {
        summary: videoAnalysis.coachingFeedback.summary || '',
        bodyLanguageAnalysis: videoAnalysis.coachingFeedback.bodyLanguageAnalysis || '',
        vocalAnalysis: videoAnalysis.coachingFeedback.vocalAnalysis || '',
        recommendations: videoAnalysis.coachingFeedback.recommendations || '',
        practiceExercises: videoAnalysis.coachingFeedback.practiceExercises || [],
        quickWins: videoAnalysis.coachingFeedback.quickWins || [],
      } : undefined,

      // User Data
      userData: {
        name: videoAnalysis.uploadInfo?.userId || 'Unknown User',
        email: '', // Could be populated from user data if available
        role: '', // Could be populated from user data if available
        department: '', // Could be populated from user data if available
        employeeId: '', // Could be populated from user data if available
        position: '', // Could be populated from user data if available
      },
    };

    // Always return JSON for client-side html2pdf generation
    console.log('🧾 Returning comprehensive report JSON for html2pdf client generation');
    return NextResponse.json(
      {
        success: true,
        reportData: comprehensiveReport
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error exporting video analysis to PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatGestureString(gestureData: any): string {
  if (!gestureData) return '0 (0%)';

  const count = gestureData.count || 0;
  const percentage = gestureData.percentage || 0;

  return `${count} (${percentage.toFixed(1)}%)`;
}
