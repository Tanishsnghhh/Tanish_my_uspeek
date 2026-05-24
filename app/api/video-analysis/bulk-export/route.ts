import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';
import { generateVideoAnalysisPDF, type ComprehensiveAnalysisReport } from '@/lib/server-pdf-generator';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// POST /api/video-analysis/bulk-export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'pdf', uploadIds, exportType = 'individual' } = body;

    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Upload IDs array is required' },
        { status: 400 }
      );
    }

    // Extract account_id from JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let accountId: string;
    let userId: string;
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded?.corporateAccountId || !decoded?.userId) {
        return NextResponse.json(
          { success: false, error: 'Invalid token: missing account or user ID' },
          { status: 401 }
        );
      }
      accountId = decoded.corporateAccountId;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const exportedFiles: string[] = [];
    let processedCount = 0;

    // Process each upload ID
    for (const uploadId of uploadIds) {
      try {
        // Fetch video analysis data from MongoDB
        const videoAnalysis = await videoAnalysisService.getVideoAnalysis(uploadId, accountId);
        
        if (!videoAnalysis) {
          console.warn(`Video analysis not found for uploadId: ${uploadId}`);
          continue;
        }

        // Create comprehensive report data structure
        const comprehensiveReport: ComprehensiveAnalysisReport = {
          analysisData: {
            filename: videoAnalysis.uploadInfo.filename,
            file_size: formatFileSize(videoAnalysis.uploadInfo.fileSize),
            language: videoAnalysis.uploadInfo.language,
            duration: videoAnalysis.uploadInfo.duration,
            upload_date: videoAnalysis.uploadInfo.uploadDate.toISOString(),
            speaker: videoAnalysis.uploadInfo.userId || 'Unknown Speaker',
            
            original_transcript: videoAnalysis.transcript.originalTranscript,
            corrected_transcript: videoAnalysis.transcript.correctedTranscript,
            summary: videoAnalysis.transcript.summary,
            keywords: videoAnalysis.transcript.keywords,
            
            content_assessment: videoAnalysis.wordPowerAnalysis ? {
              word_power_score: videoAnalysis.wordPowerAnalysis.overallScore,
              word_power_percentage: videoAnalysis.wordPowerAnalysis.scoreOutOfFive * 20,
              overall_strength: videoAnalysis.wordPowerAnalysis.overallStrength,
              strength_level: videoAnalysis.wordPowerAnalysis.strengthLevel,
              strength_description: videoAnalysis.wordPowerAnalysis.strengthDescription,
              top_strength: videoAnalysis.wordPowerAnalysis.topStrength,
              vocabulary_diversity: videoAnalysis.wordPowerAnalysis.contentAssessment?.vocabularyDiversity,
              clarity_score: videoAnalysis.wordPowerAnalysis.contentAssessment?.clarityScore,
              fluency_score: videoAnalysis.wordPowerAnalysis.contentAssessment?.fluency?.score,
              word_count: videoAnalysis.transcript.wordCount,
              avg_words_per_sentence: videoAnalysis.wordPowerAnalysis.contentAssessment?.sentenceStructure?.avgWordsPerSentence,
              sentence_count: videoAnalysis.wordPowerAnalysis.contentAssessment?.sentenceStructure?.sentenceCount,
            } : undefined,
            
            sentiment_analysis: videoAnalysis.sentimentAnalysis ? {
              overall_sentiment: videoAnalysis.sentimentAnalysis.overallSentiment,
              confidence: videoAnalysis.sentimentAnalysis.confidence,
              positive_score: videoAnalysis.sentimentAnalysis.positiveScore,
              negative_score: videoAnalysis.sentimentAnalysis.negativeScore,
              neutral_score: videoAnalysis.sentimentAnalysis.neutralScore,
            } : undefined,
            
            emotion_analysis: videoAnalysis.emotionAnalysis ? {
              dominant_emotion: videoAnalysis.emotionAnalysis.dominantEmotion,
              confidence: videoAnalysis.emotionAnalysis.confidence,
              emotion_scores: videoAnalysis.emotionAnalysis.emotionScores,
              detected_keywords: videoAnalysis.emotionAnalysis.detectedKeywords,
            } : undefined,
            
            confidence_analysis: videoAnalysis.confidenceAnalysis ? {
              overall_confidence: videoAnalysis.confidenceAnalysis.overallConfidence,
              confidence_level: videoAnalysis.confidenceAnalysis.confidenceLevel,
              confidence_score: videoAnalysis.confidenceAnalysis.confidenceScore,
              engagement_level: videoAnalysis.confidenceAnalysis.engagementLevel,
              engagement_score: videoAnalysis.confidenceAnalysis.engagementScore,
              nervousness_level: videoAnalysis.confidenceAnalysis.nervousnessLevel,
              nervousness_score: videoAnalysis.confidenceAnalysis.nervousnessScore,
              positive_indicators: videoAnalysis.confidenceAnalysis.positiveIndicators,
              negative_indicators: videoAnalysis.confidenceAnalysis.negativeIndicators,
              confidence_ratio: videoAnalysis.confidenceAnalysis.confidenceRatio,
            } : undefined,
            
            repeated_words: videoAnalysis.wordPowerAnalysis?.repeatedWords,
            filler_words: videoAnalysis.wordPowerAnalysis?.fillerWords,
            strengths_improvements: videoAnalysis.overallPerformance ? {
              strengths: videoAnalysis.overallPerformance.strengths,
              improvements: videoAnalysis.overallPerformance.improvements,
            } : undefined,
          },
          
          vocalData: videoAnalysis.vocalAnalysis ? {
            audio: videoAnalysis.vocalAnalysis.audio ? {
              duration_sec: videoAnalysis.vocalAnalysis.audio.durationSec,
              volume_db: videoAnalysis.vocalAnalysis.audio.volumeDb,
              mean_pitch_hz: videoAnalysis.vocalAnalysis.audio.meanPitchHz,
              pitch_range: videoAnalysis.vocalAnalysis.audio.pitchRange,
              num_pauses: videoAnalysis.vocalAnalysis.audio.numPauses,
              spoken_duration_sec: videoAnalysis.vocalAnalysis.audio.spokenDurationSec,
            } : undefined,
            overallScore: videoAnalysis.vocalAnalysis.overallScore,
            scoreOutOfFive: videoAnalysis.vocalAnalysis.scoreOutOfFive,
            verdict: videoAnalysis.vocalAnalysis.verdict,
            // Calculate pace from available data
            pace: videoAnalysis.vocalAnalysis.audio ? {
              wordsPerMinute: Math.round((videoAnalysis.transcript.wordCount / videoAnalysis.vocalAnalysis.audio.spokenDurationSec) * 60),
              assessment: 'Calculated from audio data',
            } : undefined,
            // Use clarity from quality object
            clarity: videoAnalysis.vocalAnalysis.quality ? {
              score: videoAnalysis.vocalAnalysis.quality.clarity,
              assessment: videoAnalysis.vocalAnalysis.quality.clarity >= 80 ? 'Excellent' : 
                         videoAnalysis.vocalAnalysis.quality.clarity >= 60 ? 'Good' : 'Needs Improvement',
            } : undefined,
            quality: videoAnalysis.vocalAnalysis.quality ? {
              energy: videoAnalysis.vocalAnalysis.quality.energy,
              modulation: videoAnalysis.vocalAnalysis.quality.modulation,
              projection: videoAnalysis.vocalAnalysis.quality.projection,
            } : undefined,
            strengths: videoAnalysis.vocalAnalysis.strengths,
            improvements: videoAnalysis.vocalAnalysis.improvements,
          } : undefined,
          
          bodyLanguageData: videoAnalysis.bodyLanguageAnalysis ? {
            frames_processed: videoAnalysis.bodyLanguageAnalysis.framesProcessed,
            smiles: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.smiles),
            head_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.headMovement),
            hand_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.handMovement),
            eye_contact: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.eyeContact),
            leg_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.legMovement),
            foot_moves: formatGestureString(videoAnalysis.bodyLanguageAnalysis.gestures?.footMovement),
            overallScore: videoAnalysis.bodyLanguageAnalysis.overallScore,
            scoreOutOfFive: videoAnalysis.bodyLanguageAnalysis.scoreOutOfFive,
            processingDuration: videoAnalysis.bodyLanguageAnalysis.processingDuration,
          } : undefined,
          
          coachingData: videoAnalysis.coachingFeedback ? {
            summary: videoAnalysis.coachingFeedback.summary,
            bodyLanguageAnalysis: videoAnalysis.coachingFeedback.bodyLanguageAnalysis,
            vocalAnalysis: videoAnalysis.coachingFeedback.vocalAnalysis,
            recommendations: videoAnalysis.coachingFeedback.recommendations,
            practiceExercises: videoAnalysis.coachingFeedback.practiceExercises,
            quickWins: videoAnalysis.coachingFeedback.quickWins,
          } : undefined,
          
          userData: {
            name: videoAnalysis.uploadInfo.userId || 'Unknown User',
          },
        };

        if (format === 'pdf') {
          // Generate individual PDF file
          const filename = `analysis-report-${videoAnalysis.uploadInfo.filename.replace(/\.[^/.]+$/, "")}-${Date.now()}.pdf`;
          const filePath = path.join(exportsDir, filename);
          
          // Here you would call the PDF generation function
          // For now, we'll create a placeholder
          fs.writeFileSync(filePath, JSON.stringify(comprehensiveReport, null, 2));
          
          exportedFiles.push(`/exports/${filename}`);
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing uploadId ${uploadId}:`, error);
      }
    }

    if (exportedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No reports could be generated' },
        { status: 400 }
      );
    }

    // Set expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return NextResponse.json({
      success: true,
      exportedFiles,
      processedCount,
      totalRequested: uploadIds.length,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error creating bulk video analysis export:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
