/**
 * 🎯 Video Analysis Update API - MongoDB Integration
 * Handles analysis updates from Django processing pipeline
 * Supports vocal, word power, body language, and sentiment analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Analysis update request received...');
    
    // Get account ID from headers
    const accountId = request.headers.get('x-account-id') || 
                     request.headers.get('Account-ID') || 
                     request.headers.get('account-id') || 
                     'default';
    
    const data = await request.json();
    const { uploadId, analysisType, analysisData } = data;
    
    if (!uploadId || !analysisType || !analysisData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: uploadId, analysisType, or analysisData'
      }, { status: 400 });
    }
    
    console.log(`🎯 Updating ${analysisType} analysis for Account: ${accountId}, Upload: ${uploadId}`);
    
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
    
    // Prepare update data based on analysis type
    let updateData: any = {};
    let newProgress = videoAnalysis.processingInfo.progress;
    let newStage = videoAnalysis.processingInfo.stage;
    let newStatus = videoAnalysis.processingInfo.status;
    
    switch (analysisType) {
      case 'vocal_analysis':
        updateData.vocalAnalysis = {
          overallScore: analysisData.overallScore || 0,
          scoreOutOfFive: analysisData.scoreOutOfFive || 0,
          audio: {
            durationSec: analysisData.audio?.duration_sec || analysisData.audio?.durationSec || 0,
            volumeDb: analysisData.audio?.volume_db || analysisData.audio?.volumeDb || 0,
            meanPitchHz: analysisData.audio?.mean_pitch_hz || analysisData.audio?.meanPitchHz || 0,
            pitchRange: analysisData.audio?.pitch_range || analysisData.audio?.pitchRange || '0-0 Hz',
            avgPitchRange: analysisData.audio?.avg_pitch_range || analysisData.audio?.avgPitchRange || 0,
            minPitch: analysisData.audio?.min_pitch || analysisData.audio?.minPitch || 0,
            maxPitch: analysisData.audio?.max_pitch || analysisData.audio?.maxPitch || 0,
            numPauses: analysisData.audio?.num_pauses || analysisData.audio?.numPauses || 0,
            spokenDurationSec: analysisData.audio?.spoken_duration_sec || analysisData.audio?.spokenDurationSec || 0,
            speakingTimePercentage: analysisData.audio?.speaking_time_percentage || analysisData.audio?.speakingTimePercentage || 0
          },
          quality: {
            clarity: analysisData.quality?.clarity || 0,
            fluency: analysisData.quality?.fluency || 0,
            energy: analysisData.quality?.energy || 'Unknown',
            modulation: analysisData.quality?.modulation || 0,
            projection: analysisData.quality?.projection || 'Unknown'
          },
          strengths: analysisData.strengths || [],
          improvements: analysisData.improvements || [],
          verdict: analysisData.verdict || 'Unknown'
        };
        newProgress = 50;
        newStage = 'vocal_analysis_complete';
        break;
        
      case 'word_power_analysis':
        updateData.wordPowerAnalysis = {
          overallScore: analysisData.overallScore || 0,
          scoreOutOfFive: analysisData.scoreOutOfFive || 0,
          contentAssessment: analysisData.contentAssessment || {},
          overallStrength: analysisData.overallStrength || 0,
          strengthLevel: analysisData.strengthLevel || 'Unknown',
          strengthDescription: analysisData.strengthDescription || '',
          topStrength: analysisData.topStrength || 'Unknown',
          fillerWords: analysisData.fillerWords || [],
          repeatedWords: analysisData.repeatedWords || [],
          keyImprovement: analysisData.keyImprovement || '',
          improvements: analysisData.improvements || []
        };
        newProgress = 70;
        newStage = 'word_power_analysis_complete';
        break;
        
      case 'body_language_analysis':
        updateData.bodyLanguageAnalysis = {
          overallScore: analysisData.overallScore || 0,
          scoreOutOfFive: analysisData.scoreOutOfFive || 0,
          framesProcessed: analysisData.framesProcessed || analysisData.frames_processed || 0,
          processingDuration: analysisData.processingDuration || '',
          gestures: {
            smiles: {
              count: analysisData.gestures?.smiles?.count || 0,
              percentage: analysisData.gestures?.smiles?.percentage || 0,
              description: analysisData.gestures?.smiles?.description || '0 (0%)'
            },
            headMovement: {
              count: analysisData.gestures?.headMovement?.count || analysisData.gestures?.head_moves?.count || 0,
              percentage: analysisData.gestures?.headMovement?.percentage || analysisData.gestures?.head_moves?.percentage || 0,
              description: analysisData.gestures?.headMovement?.description || analysisData.gestures?.head_moves?.description || '0 (0%)',
              stability: analysisData.gestures?.headMovement?.stability || 'Unknown'
            },
            handMovement: {
              count: analysisData.gestures?.handMovement?.count || analysisData.gestures?.hand_moves?.count || 0,
              percentage: analysisData.gestures?.handMovement?.percentage || analysisData.gestures?.hand_moves?.percentage || 0,
              description: analysisData.gestures?.handMovement?.description || analysisData.gestures?.hand_moves?.description || '0 (0%)',
              effectiveness: analysisData.gestures?.handMovement?.effectiveness || 'Unknown'
            },
            eyeContact: {
              count: analysisData.gestures?.eyeContact?.count || analysisData.gestures?.eye_contact?.count || 0,
              percentage: analysisData.gestures?.eyeContact?.percentage || analysisData.gestures?.eye_contact?.percentage || 0,
              description: analysisData.gestures?.eyeContact?.description || analysisData.gestures?.eye_contact?.description || '0 (0%)',
              engagement: analysisData.gestures?.eyeContact?.engagement || 'Unknown'
            },
            legMovement: {
              count: analysisData.gestures?.legMovement?.count || analysisData.gestures?.leg_moves?.count || 0,
              percentage: analysisData.gestures?.legMovement?.percentage || analysisData.gestures?.leg_moves?.percentage || 0,
              description: analysisData.gestures?.legMovement?.description || analysisData.gestures?.leg_moves?.description || '0 (0%)'
            },
            footMovement: {
              count: analysisData.gestures?.footMovement?.count || analysisData.gestures?.foot_moves?.count || 0,
              percentage: analysisData.gestures?.footMovement?.percentage || analysisData.gestures?.foot_moves?.percentage || 0,
              description: analysisData.gestures?.footMovement?.description || analysisData.gestures?.foot_moves?.description || '0 (0%)'
            }
          },
          posture: {
            straightPosture: analysisData.posture?.straightPosture || analysisData.posture?.straight_posture || 0,
            shoulderPosition: analysisData.posture?.shoulderPosition || analysisData.posture?.shoulder_position || 0,
            stability: analysisData.posture?.stability || 'Unknown',
            confidence: analysisData.posture?.confidence || 'Unknown'
          },
          topAreas: analysisData.topAreas || analysisData.top_areas || [],
          improvements: analysisData.improvements || [],
          verdict: analysisData.verdict || 'Unknown'
        };
        newProgress = 85;
        newStage = 'body_language_analysis_complete';
        break;
        
      case 'sentiment_analysis':
        updateData.sentimentAnalysis = {
          overallSentiment: analysisData.overall_sentiment || analysisData.overallSentiment || 'neutral',
          confidence: analysisData.confidence || 0,
          positiveScore: analysisData.positive_score || analysisData.positiveScore || 0,
          negativeScore: analysisData.negative_score || analysisData.negativeScore || 0,
          neutralScore: analysisData.neutral_score || analysisData.neutralScore || 0,
          label: analysisData.label || analysisData.overall_sentiment || 'neutral'
        };
        break;
        
      case 'emotion_analysis':
        updateData.emotionAnalysis = {
          dominantEmotion: analysisData.dominant_emotion || analysisData.dominantEmotion || 'neutral',
          confidence: analysisData.confidence || 0,
          emotionScores: analysisData.emotion_scores || analysisData.emotionScores || {},
          detectedKeywords: analysisData.detected_keywords || analysisData.detectedKeywords || []
        };
        break;
        
      case 'confidence_analysis':
        updateData.confidenceAnalysis = {
          overallConfidence: analysisData.overall_confidence || analysisData.overallConfidence || 0,
          confidenceLevel: analysisData.confidence_level || analysisData.confidenceLevel || 'Unknown',
          confidenceScore: analysisData.confidence_score || analysisData.confidenceScore || 0,
          engagementLevel: analysisData.engagement_level || analysisData.engagementLevel || 'Unknown',
          engagementScore: analysisData.engagement_score || analysisData.engagementScore || 0,
          nervousnessLevel: analysisData.nervousness_level || analysisData.nervousnessLevel || 'Unknown',
          nervousnessScore: analysisData.nervousness_score || analysisData.nervousnessScore || 0,
          positiveIndicators: analysisData.positive_indicators || analysisData.positiveIndicators || 0,
          negativeIndicators: analysisData.negative_indicators || analysisData.negativeIndicators || 0,
          confidenceRatio: analysisData.confidence_ratio || analysisData.confidenceRatio || 0
        };
        break;
        
      case 'overall_performance':
        updateData.overallPerformance = {
          totalScore: analysisData.total_score || analysisData.totalScore || 0,
          industryAverage: analysisData.industry_average || analysisData.industryAverage || 65,
          performanceLevel: analysisData.performance_level || analysisData.performanceLevel || 'Unknown',
          vocalScore: analysisData.vocal_score || analysisData.vocalScore || 0,
          wordScore: analysisData.word_score || analysisData.wordScore || 0,
          bodyScore: analysisData.body_score || analysisData.bodyScore || 0,
          title: analysisData.title || 'Performance Analysis',
          message: analysisData.message || '',
          strengths: analysisData.strengths || [],
          improvements: analysisData.improvements || []
        };
        newProgress = 95;
        newStage = 'overall_analysis_complete';
        newStatus = 'completed';
        break;
        
      case 'coaching_feedback':
        updateData.coachingFeedback = {
          summary: analysisData.summary || '',
          bodyLanguageAnalysis: analysisData.body_language_analysis || analysisData.bodyLanguageAnalysis || '',
          vocalAnalysis: analysisData.vocal_analysis || analysisData.vocalAnalysis || '',
          recommendations: analysisData.recommendations || '',
          practiceExercises: analysisData.practice_exercises || analysisData.practiceExercises || [],
          quickWins: analysisData.quick_wins || analysisData.quickWins || []
        };
        newProgress = 100;
        newStage = 'coaching_feedback_complete';
        newStatus = 'completed';
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown analysis type: ${analysisType}`
        }, { status: 400 });
    }
    
    // Update processing info
    updateData['processingInfo.status'] = newStatus;
    updateData['processingInfo.progress'] = newProgress;
    updateData['processingInfo.stage'] = newStage;
    updateData['metadata.updatedAt'] = new Date();
    
    // Update MongoDB record
    const updated = await videoAnalysisService.updateAnalysisData(uploadId, accountId, updateData);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update video analysis',
        uploadId: uploadId,
        accountId: accountId
      }, { status: 500 });
    }
    
    console.log(`✅ ${analysisType} analysis updated successfully for Upload: ${uploadId}`);
    
    // 🚀 Trigger business metrics calculation if analysis is now complete
    if (newStatus === 'completed') {
      try {
        console.log('🎯 Analysis completed, triggering business metrics calculation...');
        
        // Import the trigger service dynamically to avoid circular dependencies
        const { triggerBusinessMetricsCalculation } = await import('@/lib/services/business-metrics-trigger');
        
        // Find the user and business unit for this upload
        const db = await import('@/lib/database').then(m => m.getDatabase());
        const videoAnalysis = await videoAnalysisService.getVideoAnalysis(uploadId, accountId);
        
        if (videoAnalysis) {
          const userId = videoAnalysis.uploadInfo.userId;
          if (!userId) {
            console.warn('No userId found in video analysis for metrics trigger');
            return;
          }
          const actualUserId = userId.replace(/^(EMPLOYEE:|ADMIN:|CORPORATE_ADMIN:)/, '');
          
          // Find employee
          const employeeProfiles = db.collection('employeeprofiles');
          let employee = null;
          
          try {
            if (ObjectId.isValid(actualUserId)) {
              employee = await employeeProfiles.findOne({ user_id: new ObjectId(actualUserId) });
            }
          } catch (e) {
            // Ignore ObjectId errors
          }
          
          if (!employee) {
            try {
              if (ObjectId.isValid(actualUserId)) {
                employee = await employeeProfiles.findOne({ _id: new ObjectId(actualUserId) });
              }
            } catch (e) {
              // Ignore ObjectId errors
            }
          }
          
          if (!employee) {
            employee = await employeeProfiles.findOne({ employeeId: actualUserId });
          }
          
          let businessCode = undefined;
          if (employee) {
            // Find business unit
            const businessUnits = db.collection('businessunits');
            const assignedEmployeesStrings = employee._id ? [employee._id.toString(), employee.user_id?.toString()].filter(Boolean) : [employee.user_id?.toString()].filter(Boolean);
            
            const businessUnit = await businessUnits.findOne({
              assignedEmployees: { $in: assignedEmployeesStrings }
            });
            
            if (businessUnit) {
              businessCode = businessUnit.businessCode;
            }
          }
          
          // Trigger calculation
          const result = await triggerBusinessMetricsCalculation({
            businessCode: businessCode,
            accountId: accountId,
            periodType: 'all-time'
          });
          
          if (result.success) {
            console.log('✅ Business metrics updated after analysis completion');
          } else {
            console.warn('⚠️ Business metrics update failed:', result.error);
          }
        }
      } catch (triggerError) {
        console.error('Error triggering business metrics calculation:', triggerError);
        // Don't fail the analysis update if metrics trigger fails
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `${analysisType} analysis updated successfully`,
      uploadId: uploadId,
      accountId: accountId,
      analysisType: analysisType,
      
      // Processing status
      processingInfo: {
        status: newStatus,
        stage: newStage,
        progress: newProgress
      },
      
      // Next steps
      nextSteps: {
        statusAPI: `/api/video-analysis/status/${uploadId}`,
        resultsAPI: `/api/video-analysis/results/${uploadId}`,
        isComplete: newStatus === 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Analysis update error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
