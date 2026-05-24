/**
 * Data transformation utilities for converting MongoDB video analysis data
 * to the format expected by the VideoReport component
 */

// MongoDB data structure interface
export interface MongoVideoAnalysis {
  _id: string;
  uploadInfo: {
    uploadId: string;
    filename: string;
    fileSize: number;
    duration: string;
    durationSeconds: number;
    uploadDate: string;
    language: string;
    userId: string;
    accountId: string;
    filePath: string;
  };
  transcript: {
    originalTranscript: string;
    correctedTranscript: string;
    summary: string;
    keywords: string;
    wordCount: number;
    sentences: number;
  };
  vocalAnalysis: {
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
      avgPauseLength: number;
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
  };
  wordPowerAnalysis: {
    overallScore: number;
    scoreOutOfFive: number;
    contentAssessment: {
      overallStrength: number;
      strengthLevel: string;
      strengthDescription: string;
      topStrength: string;
    };
    fillerWords: Array<{
      word: string;
      count: number;
      percentage: number;
    }>;
    repeatedWords: Array<{
      word: string;
      count: number;
      keyImprovement?: string;
    }>;
    improvements: string[];
  };
  bodyLanguageAnalysis: {
    overallScore: number;
    scoreOutOfFive: number;
    framesProcessed: number;
    processingDuration: string;
    gestures: {
      smiles: {
        count: number;
        percentage: number;
        description: string;
        effectiveness: string;
        engagement: string;
        stability: string;
      };
      headMovement: {
        count: number;
        percentage: number;
        description: string;
        effectiveness: string;
        engagement: string;
        stability: string;
      };
      handMovement: {
        count: number;
        percentage: number;
        description: string;
        effectiveness: string;
        engagement: string;
        stability: string;
      };
      eyeContact: {
        count: number;
        percentage: number;
        description: string;
        effectiveness: string;
        engagement: string;
        stability: string;
      };
      footMovement: {
        count: number;
        percentage: number;
        description: string;
        effectiveness: string;
        engagement: string;
        stability: string;
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
  };
  sentimentAnalysis: {
    overallSentiment: string;
    confidence: number;
    positiveScore: number;
    negativeScore: number;
    neutralScore: number;
    label: string;
  };
  emotionAnalysis: {
    dominantEmotion: string;
    confidence: number;
    emotionScores: Record<string, number>;
    detectedKeywords: Array<[string, string]>;
  };
  confidenceAnalysis: {
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
  };
  overallPerformance: {
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
  };
  coachingFeedback: {
    summary: string;
    bodyLanguageAnalysis: string;
    vocalAnalysis: string;
    recommendations: string;
    practiceExercises: string[];
    quickWins: string[];
  };
}

// Django format expected by VideoReport component
export interface DjangoAnalysisData {
  filename: string;
  file_size: string;
  language: string;
  duration: string;
  original_transcript: string;
  corrected_transcript: string;
  summary: string;
  keywords: string;
  repeated_words: Array<{ word: string; count: number }>;
  filler_words: Array<{ word: string; count: number; percentage: number }>;
  sentiment_analysis: any;
  content_assessment: any;
  strengths_improvements: any;
  emotion_analysis: any;
  confidence_analysis: any;
  videoUrl?: string;
}

export interface PoseAnalysisData {
  frames_processed: number;
  smiles: string;
  head_moves: string;
  hand_moves: string;
  eye_contact: string;
  leg_moves: string;
  foot_moves: string;
  audio: {
    duration_sec: number;
    volume_db: number;
    mean_pitch_hz: number;
    pitch_range: string;
    num_pauses: number;
    spoken_duration_sec: number;
  };
}

export interface CoachingData {
  summary: string;
  interpretation: string;
  suggestions: string;
}

/**
 * Transform MongoDB video analysis data to Django format expected by VideoReport
 */
export function transformMongoToDjango(mongoData: MongoVideoAnalysis): {
  analysisData: DjangoAnalysisData;
  poseData: PoseAnalysisData;
  coachingData: CoachingData;
} {
  // Transform analysis data
  const analysisData: DjangoAnalysisData = {
    filename: mongoData.uploadInfo.filename,
    file_size: formatFileSize(mongoData.uploadInfo.fileSize),
    language: mongoData.uploadInfo.language,
    duration: mongoData.uploadInfo.duration,
    original_transcript: mongoData.transcript.originalTranscript,
    corrected_transcript: mongoData.transcript.correctedTranscript,
    summary: mongoData.transcript.summary,
    keywords: mongoData.transcript.keywords,
    repeated_words: mongoData.wordPowerAnalysis.repeatedWords.map(rw => ({
      word: rw.word,
      count: rw.count
    })),
    filler_words: mongoData.wordPowerAnalysis.fillerWords,
    sentiment_analysis: {
      overall_sentiment: mongoData.sentimentAnalysis.overallSentiment,
      confidence: mongoData.sentimentAnalysis.confidence,
      positive_score: mongoData.sentimentAnalysis.positiveScore,
      negative_score: mongoData.sentimentAnalysis.negativeScore,
      neutral_score: mongoData.sentimentAnalysis.neutralScore,
      label: mongoData.sentimentAnalysis.label
    },
    content_assessment: {
      word_power_score: mongoData.wordPowerAnalysis.overallScore,
      word_power_percentage: mongoData.wordPowerAnalysis.scoreOutOfFive * 20, // Convert 0-5 to 0-100
      overall_strength: mongoData.wordPowerAnalysis.contentAssessment.overallStrength,
      strength_level: mongoData.wordPowerAnalysis.contentAssessment.strengthLevel,
      strength_description: mongoData.wordPowerAnalysis.contentAssessment.strengthDescription,
      top_strength: mongoData.wordPowerAnalysis.contentAssessment.topStrength
    },
    strengths_improvements: {
      strengths: mongoData.overallPerformance.strengths,
      improvements: mongoData.overallPerformance.improvements
    },
    emotion_analysis: {
      dominant_emotion: mongoData.emotionAnalysis.dominantEmotion,
      confidence: mongoData.emotionAnalysis.confidence,
      emotion_scores: mongoData.emotionAnalysis.emotionScores,
      detected_keywords: mongoData.emotionAnalysis.detectedKeywords
    },
    confidence_analysis: {
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
    },
    videoUrl: mongoData.uploadInfo.filePath ? `/uploads/${mongoData.uploadInfo.accountId}/${mongoData.uploadInfo.filename}` : undefined
  };

  // Transform pose analysis data
  const poseData: PoseAnalysisData = {
    frames_processed: mongoData.bodyLanguageAnalysis.framesProcessed,
    smiles: `${mongoData.bodyLanguageAnalysis.gestures.smiles.count} (${mongoData.bodyLanguageAnalysis.gestures.smiles.percentage.toFixed(1)}%)`,
    head_moves: `${mongoData.bodyLanguageAnalysis.gestures.headMovement.count} (${mongoData.bodyLanguageAnalysis.gestures.headMovement.percentage.toFixed(1)}%)`,
    hand_moves: `${mongoData.bodyLanguageAnalysis.gestures.handMovement.count} (${mongoData.bodyLanguageAnalysis.gestures.handMovement.percentage.toFixed(1)}%)`,
    eye_contact: `${mongoData.bodyLanguageAnalysis.gestures.eyeContact.count} (${mongoData.bodyLanguageAnalysis.gestures.eyeContact.percentage.toFixed(1)}%)`,
    leg_moves: "0 (0%)", // MongoDB doesn't have leg movement data
    foot_moves: `${mongoData.bodyLanguageAnalysis.gestures.footMovement.count} (${mongoData.bodyLanguageAnalysis.gestures.footMovement.percentage.toFixed(1)}%)`,
    audio: {
      duration_sec: mongoData.vocalAnalysis.audio.durationSec,
      volume_db: mongoData.vocalAnalysis.audio.volumeDb,
      mean_pitch_hz: mongoData.vocalAnalysis.audio.meanPitchHz,
      pitch_range: mongoData.vocalAnalysis.audio.pitchRange,
      num_pauses: mongoData.vocalAnalysis.audio.numPauses,
      spoken_duration_sec: mongoData.vocalAnalysis.audio.spokenDurationSec
    }
  };

  // Transform coaching data
  const coachingData: CoachingData = {
    summary: mongoData.coachingFeedback.summary,
    interpretation: mongoData.coachingFeedback.bodyLanguageAnalysis,
    suggestions: mongoData.coachingFeedback.recommendations
  };

  return {
    analysisData,
    poseData,
    coachingData
  };
}

/**
 * Format file size from bytes to human readable format
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration from seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
