/**
 * 🎯 Save Video Analysis Results to MongoDB
 * Stores complete analysis data from Django backend into MongoDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/video-analysis-service';
import { getDatabase } from '@/lib/database';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    
    const requestData = await request.json();
    const {
      uploadId,
      accountId = 'default',
      userId,
      filename,
      transcript,
      poseAnalysis,
      coaching,
      fileSize,
      timestamp
    } = requestData;

    if (!uploadId || !filename || !transcript) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: uploadId, filename, or transcript'
      }, { status: 400 });
    }

    // Get corporate account ID from employee profile
    let corporateAccountId = null;
    try {
      const db = await getDatabase();
      const employeeProfiles = db.collection('employeeprofiles');
      const actualUserId = userId.replace(/^(EMPLOYEE:|ADMIN:|CORPORATE_ADMIN:)/, '');
      
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
      
      if (employee && employee.corporate_account_id) {
        corporateAccountId = employee.corporate_account_id;
      } else if (ObjectId.isValid(accountId)) {
        // Fallback to accountId if it's a valid ObjectId
        corporateAccountId = new ObjectId(accountId);
      }
    } catch (error) {
      console.error('Error getting corporate account ID:', error);
    }

    // Map the Django analysis results to our MongoDB schema
    const videoAnalysisData = {
      uploadInfo: {
        uploadId: uploadId,
        filename: filename,
        fileSize: fileSize || 0,
        duration: transcript.duration || '00:00:00',
        durationSeconds: transcript.duration_seconds || 0,
        uploadDate: new Date(timestamp || new Date()),
        language: transcript.language || 'en',
        userId: userId,
        accountId: accountId,
        corporate_account_id: corporateAccountId,
        filePath: `/uploads/${filename}`
      },
      
      transcript: {
        originalTranscript: transcript.original_transcript || '',
        correctedTranscript: transcript.corrected_transcript || '',
        summary: transcript.summary || '',
        keywords: transcript.keywords || '',
        wordCount: transcript.original_transcript?.split(' ').length || 0,
        sentences: transcript.original_transcript?.split(/[.!?]+/).length || 0
      },

      // Vocal Analysis from pose analysis audio data
      vocalAnalysis: poseAnalysis?.audio ? {
        overallScore: calculateVocalScore(poseAnalysis.audio),
        scoreOutOfFive: Math.round(calculateVocalScore(poseAnalysis.audio) / 20),
        audio: {
          durationSec: poseAnalysis.audio.duration_sec || 0,
          volumeDb: poseAnalysis.audio.volume_db || 0,
          meanPitchHz: poseAnalysis.audio.mean_pitch_hz || 0,
          pitchRange: poseAnalysis.audio.pitch_range || '0-0 Hz',
          avgPitchRange: poseAnalysis.audio.avg_pitch_range || 0,
          minPitch: extractMinPitch(poseAnalysis.audio.pitch_range),
          maxPitch: extractMaxPitch(poseAnalysis.audio.pitch_range),
          numPauses: poseAnalysis.audio.num_pauses || 0,
          spokenDurationSec: poseAnalysis.audio.spoken_duration_sec || 0,
          speakingTimePercentage: calculateSpeakingPercentage(
            poseAnalysis.audio.spoken_duration_sec, 
            poseAnalysis.audio.duration_sec
          ),
          avgPauseLength: calculateAvgPauseLength(
            poseAnalysis.audio.num_pauses,
            poseAnalysis.audio.duration_sec,
            poseAnalysis.audio.spoken_duration_sec
          )
        },
        quality: {
          clarity: calculateClarity(poseAnalysis.audio.volume_db),
          fluency: calculateFluency(poseAnalysis.audio.num_pauses, poseAnalysis.audio.duration_sec),
          energy: getEnergyLevel(poseAnalysis.audio.volume_db),
          modulation: calculateModulation(poseAnalysis.audio.avg_pitch_range),
          projection: getProjectionLevel(poseAnalysis.audio.volume_db)
        },
        strengths: generateVocalStrengths(poseAnalysis.audio),
        improvements: generateVocalImprovements(poseAnalysis.audio),
        verdict: generateVocalVerdict(poseAnalysis.audio)
      } : undefined,

      // Word Power Analysis from transcript analysis
      wordPowerAnalysis: transcript ? {
        overallScore: calculateWordPowerScore(transcript),
        scoreOutOfFive: Math.round(calculateWordPowerScore(transcript) / 20),
        contentAssessment: {
          qualityScore: transcript.content_assessment?.quality_score || 70,
          vocabularyDiversity: transcript.content_assessment?.vocabulary_diversity || 65,
          vocabularyScore: transcript.content_assessment?.vocabulary_score || 70,
          clarityScore: transcript.content_assessment?.clarity_score || 75,
          complexityLevel: transcript.content_assessment?.complexity_level || 'Intermediate',
          contentLength: {
            score: transcript.content_assessment?.content_length?.score || 75,
            wordCount: transcript.original_transcript?.split(' ').length || 0,
            description: transcript.content_assessment?.content_length?.description || 'Appropriate length',
            targetWords: 150
          },
          fluency: {
            score: transcript.content_assessment?.fluency?.score || 70,
            fillerWordsPercentage: calculateFillerPercentage(transcript.filler_words, transcript.original_transcript),
            description: transcript.content_assessment?.fluency?.description || 'Good fluency'
          },
          sentenceStructure: {
            score: transcript.content_assessment?.sentence_structure?.score || 75,
            avgWordsPerSentence: calculateAvgWordsPerSentence(transcript.original_transcript),
            sentenceCount: transcript.original_transcript?.split(/[.!?]+/).length || 0,
            description: transcript.content_assessment?.sentence_structure?.description || 'Well-structured sentences'
          },
          flow: {
            score: transcript.content_assessment?.flow?.score || 70,
            transitionWordCount: countTransitionWords(transcript.original_transcript),
            description: transcript.content_assessment?.flow?.description || 'Good flow'
          }
        },
        overallStrength: transcript.strengths_improvements?.strengths?.overall_strength || 75,
        strengthLevel: transcript.strengths_improvements?.strengths?.strength_level || 'Good',
        strengthDescription: transcript.strengths_improvements?.strengths?.description || 'Shows good communication skills',
        topStrength: transcript.strengths_improvements?.strengths?.top_strength || 'Clear communication',
        fillerWords: transcript.filler_words || [],
        repeatedWords: transcript.repeated_words || [],
        keyImprovement: transcript.strengths_improvements?.improvements?.key_improvement || 'Continue practicing',
        improvements: transcript.strengths_improvements?.improvements?.suggestions || []
      } : undefined,

      // Body Language Analysis from pose analysis
      bodyLanguageAnalysis: poseAnalysis ? {
        overallScore: calculateBodyLanguageScore(poseAnalysis),
        scoreOutOfFive: Math.round(calculateBodyLanguageScore(poseAnalysis) / 20),
        framesProcessed: poseAnalysis.frames_processed || 0,
        processingDuration: '2.5s',
        gestures: {
          smiles: parseGestureData(poseAnalysis.smiles, 'Engaging and warm facial expressions'),
          headMovement: parseGestureData(poseAnalysis.head_moves, 'Natural head movement shows engagement'),
          handMovement: parseGestureData(poseAnalysis.hand_moves, 'Expressive hand gestures enhance communication'),
          eyeContact: parseGestureData(poseAnalysis.eye_contact, 'Good eye contact builds connection'),
          legMovement: parseGestureData(poseAnalysis.leg_moves, 'Stable lower body positioning'),
          footMovement: parseGestureData(poseAnalysis.foot_moves, 'Grounded and confident stance')
        },
        posture: {
          straightPosture: calculatePostureScore(poseAnalysis),
          shoulderPosition: 85,
          stability: getStabilityLevel(poseAnalysis),
          confidence: getConfidenceLevel(poseAnalysis)
        },
        topAreas: generateBodyLanguageStrengths(poseAnalysis),
        improvements: generateBodyLanguageImprovements(poseAnalysis),
        verdict: generateBodyLanguageVerdict(poseAnalysis)
      } : undefined,

      // Sentiment Analysis from transcript
      sentimentAnalysis: transcript?.sentiment_analysis ? {
        overallSentiment: transcript.sentiment_analysis.sentiment || 'neutral',
        confidence: transcript.sentiment_analysis.confidence || 0.7,
        positiveScore: transcript.sentiment_analysis.positive || 0.4,
        negativeScore: transcript.sentiment_analysis.negative || 0.2,
        neutralScore: transcript.sentiment_analysis.neutral || 0.4,
        label: transcript.sentiment_analysis.sentiment || 'neutral'
      } : undefined,

      // Emotion Analysis from transcript
      emotionAnalysis: transcript?.emotion_analysis ? {
        dominantEmotion: transcript.emotion_analysis.dominant_emotion || 'neutral',
        confidence: transcript.emotion_analysis.confidence || 0.7,
        emotionScores: transcript.emotion_analysis.emotion_scores || {},
        detectedKeywords: transcript.emotion_analysis.detected_keywords || []
      } : undefined,

      // Confidence Analysis from transcript
      confidenceAnalysis: transcript?.confidence_analysis ? {
        overallConfidence: transcript.confidence_analysis.overall_confidence || 70,
        confidenceLevel: transcript.confidence_analysis.confidence_level || 'Moderate',
        confidenceScore: transcript.confidence_analysis.confidence_score || 70,
        engagementLevel: transcript.confidence_analysis.engagement_level || 'Good',
        engagementScore: transcript.confidence_analysis.engagement_score || 75,
        nervousnessLevel: transcript.confidence_analysis.nervousness_level || 'Low',
        nervousnessScore: transcript.confidence_analysis.nervousness_score || 25,
        positiveIndicators: transcript.confidence_analysis.positive_indicators || 5,
        negativeIndicators: transcript.confidence_analysis.negative_indicators || 2,
        confidenceRatio: transcript.confidence_analysis.confidence_ratio || 2.5
      } : undefined,

      // Overall Performance combining all metrics
      overallPerformance: {
        totalScore: calculateOverallScore(transcript, poseAnalysis),
        industryAverage: 65,
        performanceLevel: getPerformanceLevel(calculateOverallScore(transcript, poseAnalysis)),
        vocalScore: poseAnalysis?.audio ? calculateVocalScore(poseAnalysis.audio) : 0,
        wordScore: transcript ? calculateWordPowerScore(transcript) : 0,
        bodyScore: poseAnalysis ? calculateBodyLanguageScore(poseAnalysis) : 0,
        title: generatePerformanceTitle(calculateOverallScore(transcript, poseAnalysis)),
        message: generatePerformanceMessage(calculateOverallScore(transcript, poseAnalysis)),
        strengths: combineAllStrengths(transcript, poseAnalysis),
        improvements: combineAllImprovements(transcript, poseAnalysis)
      },

      // Processing Info
      processingInfo: {
        analysisVersion: 'v2.1.0',
        processedDate: new Date(),
        processingTime: 15000, // milliseconds
        status: 'completed' as const,
        stage: 'analysis_complete',
        progress: 100,
        technologies: {
          transcription: 'OpenAI Whisper',
          nlp: 'Gemini AI + HuggingFace Transformers',
          bodyLanguage: 'MediaPipe + DeepFace',
          audioAnalysis: 'Parselmouth',
          sentiment: 'Custom Engine + Transformers'
        },
        qualityFlags: {
          audioQuality: 'Good',
          videoQuality: 'Good',
          transcriptionAccuracy: 'High'
        }
      },

      // Coaching Feedback
      coachingFeedback: coaching ? {
        summary: coaching.summary || '',
        bodyLanguageAnalysis: coaching.interpretation || '',
        vocalAnalysis: '', // Will be derived from audio analysis
        recommendations: coaching.suggestions || '',
        practiceExercises: extractPracticeExercises(coaching.suggestions),
        quickWins: extractQuickWins(coaching.suggestions)
      } : undefined,

      // Progress Data (will be built over time)
      progressData: {
        previousScores: [],
        improvementTrends: {
          vocal: 'improving',
          wordPower: 'stable',
          bodyLanguage: 'improving'
        },
        goalsSet: [],
        milestonesAchieved: []
      }
    };

    // Save to MongoDB
    const insertedId = await videoAnalysisService.createVideoAnalysis(videoAnalysisData);

    // Also update the videouploadactivities collection with analysis scores
    try {
      const db = await getDatabase();
      const videoUploadActivities = db.collection('videouploadactivities');
      
      // Check if videouploadactivities entry exists, if not create it
      const existingEntry = await videoUploadActivities.findOne({ uploadId: uploadId });
      
      if (!existingEntry) {
        console.log(`Creating videouploadactivities entry for uploadId: ${uploadId}`);
        
        // Try to find employee info from userId
        const employeeProfiles = db.collection('employeeprofiles');
        const actualUserId = userId.replace(/^(EMPLOYEE:|ADMIN:|CORPORATE_ADMIN:)/, '');
        
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
        
        // Get corporate account ID from employee or user
        let corporateAccountId = employee?.corporate_account_id;
        
        // If employee doesn't have corporate_account_id, get it from the user
        if (!corporateAccountId && employee?.user_id) {
          try {
            const users = db.collection('users');
            const user = await users.findOne({ _id: employee.user_id });
            if (user && user.account_id) {
              corporateAccountId = user.account_id;
            }
          } catch (error) {
            console.error('Error getting corporate account ID from user:', error);
          }
        }

        // Create minimal entry
        const minimalEntry = {
          uploadId,
          userId,
          employeeId: employee?.employeeId || actualUserId,
          corporate_account_id: corporateAccountId,
          uploadDate: new Date(timestamp || new Date()),
          filename,
          fileSize: fileSize || 0,
          duration: transcript?.duration_seconds || 0,
          
          employeeInfo: employee ? {
            firstName: employee.first_name || '',
            lastName: employee.last_name || '',
            fullName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
            employeeId: employee.employeeId || employee.user_id,
            phoneNumber: employee.phoneNumber,
            department: employee.department,
            jobTitle: employee.job_title,
            hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
            isActive: employee.isActive !== false
          } : {
            firstName: 'Unknown',
            lastName: 'User',
            fullName: 'Unknown User',
            employeeId: actualUserId,
            isActive: true
          },
          
          organizationInfo: employee?.custom_attributes ? {
            region: employee.custom_attributes.position_1 || 'Unknown',
            zone: employee.custom_attributes.position_2 || 'Unknown',
            batch: employee.custom_attributes.position_3 || 'Unknown',
            branch: employee.custom_attributes.position_4 || 'Unknown'
          } : {
            region: 'Unknown',
            zone: 'Unknown',
            batch: 'Unknown',
            branch: 'Unknown'
          },
          
          uploadInfo: {
            uploadDate: new Date(timestamp || new Date()),
            uploadTime: new Date(timestamp || new Date()).toTimeString().split(' ')[0],
            dayOfWeek: new Date(timestamp || new Date()).toLocaleDateString('en-US', { weekday: 'long' }),
            weekOfYear: getWeekOfYear(new Date(timestamp || new Date())),
            monthYear: new Date(timestamp || new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            quarter: `Q${Math.ceil((new Date(timestamp || new Date()).getMonth() + 1) / 3)} ${new Date(timestamp || new Date()).getFullYear()}`,
            uploadSource: 'api',
            ipAddress: 'unknown'
          },
          
          analysisStatus: {
            isAnalyzed: false,
            analysisDate: undefined,
            bodyLanguageScore: undefined,
            vocalToneScore: undefined,
            wordPowerScore: undefined,
            overallScore: undefined,
            analysisVersion: undefined
          },
          
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'video_analysis_save',
            version: 1
          }
        };
        
        // Add businessId if employee has business unit
        if (employee) {
          const businessUnits = db.collection('businessunits');
          const businessUnit = await businessUnits.findOne({
            assignedEmployees: { $in: [employee._id || employee.user_id] }
          });
          
          if (businessUnit) {
            (minimalEntry as any).businessId = businessUnit.businessCode;
          }
        }
        
        await videoUploadActivities.insertOne(minimalEntry);
        console.log(`Created videouploadactivities entry for uploadId: ${uploadId}`);
      }
      
      // Use the calculated scores directly from the videoAnalysisData we just created
      // instead of fetching from database (which might have timing issues)
      const overallScore = videoAnalysisData.overallPerformance?.totalScore || 0;
      const bodyScore = videoAnalysisData.overallPerformance?.bodyScore || 0;
      const vocalScore = videoAnalysisData.overallPerformance?.vocalScore || 0;
      const wordScore = videoAnalysisData.overallPerformance?.wordScore || 0;
      
      console.log(`Updating videouploadactivities for uploadId: ${uploadId}`);
      console.log(`Using calculated scores - Body: ${bodyScore}, Vocal: ${vocalScore}, Word: ${wordScore}, Overall: ${overallScore}`);
      
      await videoUploadActivities.updateOne(
        { uploadId: uploadId },
        {
          $set: {
            'analysisStatus.isAnalyzed': true,
            'analysisStatus.analysisDate': new Date(),
            'analysisStatus.bodyLanguageScore': bodyScore,
            'analysisStatus.vocalToneScore': vocalScore,
            'analysisStatus.wordPowerScore': wordScore,
            'analysisStatus.overallScore': overallScore,
            'analysisStatus.analysisVersion': '2.0',
            'metadata.updatedAt': new Date()
          }
        }
      );
      
      console.log(`Successfully updated videouploadactivities for uploadId: ${uploadId}`);
    } catch (updateError) {
      console.error('Error updating videouploadactivities:', updateError);
      // Don't fail the whole request if this update fails
    }

    // 🚀 Trigger business metrics calculation after video analysis completion
    try {
      console.log('🎯 Triggering business metrics calculation after video analysis completion...');
      console.log('User ID for trigger:', userId);
      
      // Import the trigger service dynamically to avoid circular dependencies
      const { triggerBusinessMetricsCalculation } = await import('@/lib/services/business-metrics-trigger');
      
      // Find the business unit for this user to trigger specific recalculation
      let businessCode = undefined;
      try {
        const db = await getDatabase();
        const businessUnits = db.collection('businessunits');
        const employeeProfiles = db.collection('employeeprofiles');
        
        const actualUserId = userId.replace(/^(EMPLOYEE:|ADMIN:|CORPORATE_ADMIN:)/, '');
        console.log('Actual user ID after stripping prefix:', actualUserId);
        
        let employee = null;
        
        try {
          if (ObjectId.isValid(actualUserId)) {
            employee = await employeeProfiles.findOne({ user_id: new ObjectId(actualUserId) });
            console.log('Employee found by user_id:', employee ? employee.employeeId : 'not found');
          }
        } catch (e) {
          console.log('Error finding employee by user_id:', e);
        }
        
        if (!employee) {
          try {
            if (ObjectId.isValid(actualUserId)) {
              employee = await employeeProfiles.findOne({ _id: new ObjectId(actualUserId) });
              console.log('Employee found by _id:', employee ? employee.employeeId : 'not found');
            }
          } catch (e) {
            console.log('Error finding employee by _id:', e);
          }
        }
        
        if (!employee) {
          employee = await employeeProfiles.findOne({ employeeId: actualUserId });
          console.log('Employee found by employeeId:', employee ? employee.employeeId : 'not found');
        }
        
        if (employee) {
          console.log('Found employee:', employee.employeeId, 'with _id:', employee._id, 'user_id:', employee.user_id);
          
          // Try to find business unit by assigned employees (convert ObjectId to string for comparison)
          const assignedEmployeesStrings = employee._id ? [employee._id.toString(), employee.user_id?.toString()].filter(Boolean) : [employee.user_id?.toString()].filter(Boolean);
          console.log('Looking for business unit with assigned employees:', assignedEmployeesStrings);
          
          const businessUnit = await businessUnits.findOne({
            assignedEmployees: { $in: assignedEmployeesStrings }
          });
          
          if (businessUnit) {
            businessCode = businessUnit.businessCode;
            console.log(`Found business unit ${businessCode} for user ${userId}`);
          } else {
            console.log('No business unit found for employee');
          }
        } else {
          console.log('No employee found for userId:', userId);
        }
      } catch (lookupError) {
        console.warn('Could not determine business unit for metrics trigger:', lookupError);
      }
      
      console.log('Triggering calculation with businessCode:', businessCode);
      
      // Trigger calculation synchronously to ensure it completes
      const result = await triggerBusinessMetricsCalculation({
        businessCode: businessCode,
        accountId: accountId,
        periodType: 'all-time'
      });
      
      if (result.success) {
        console.log('✅ Business metrics updated after video analysis');
      } else {
        console.warn('⚠️ Business metrics update failed:', result.error);
      }
      
    } catch (triggerError) {
      console.error('Error triggering business metrics calculation:', triggerError);
      // Don't fail the video analysis save if metrics trigger fails
    }

    return NextResponse.json({
      success: true,
      analysisId: insertedId,
      uploadId: uploadId,
      message: 'Video analysis saved successfully'
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save video analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions for calculations and data transformation

function calculateVocalScore(audio: any): number {
  let score = 70; // Base score
  
  // Volume scoring (ideal range: 50-70 dB)
  if (audio.volume_db >= 50 && audio.volume_db <= 70) score += 10;
  else if (audio.volume_db < 30) score -= 15;
  else if (audio.volume_db > 80) score -= 10;
  
  // Pitch variety scoring
  const pitchRange = extractMaxPitch(audio.pitch_range) - extractMinPitch(audio.pitch_range);
  if (pitchRange > 100) score += 10;
  else if (pitchRange < 50) score -= 10;
  
  // Pause frequency (ideal: 1-3 pauses per minute)
  const pausesPerMinute = audio.num_pauses / (audio.duration_sec / 60);
  if (pausesPerMinute >= 1 && pausesPerMinute <= 3) score += 5;
  else if (pausesPerMinute > 5) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateWordPowerScore(transcript: any): number {
  let score = 70; // Base score
  
  // Word count scoring
  const wordCount = transcript.original_transcript?.split(' ').length || 0;
  if (wordCount >= 100 && wordCount <= 300) score += 10;
  else if (wordCount < 50) score -= 15;
  
  // Filler words penalty
  const fillerCount = transcript.filler_words?.length || 0;
  if (fillerCount < 5) score += 10;
  else if (fillerCount > 15) score -= 15;
  
  // Content assessment scores
  if (transcript.content_assessment) {
    score += (transcript.content_assessment.quality_score - 70) * 0.3;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateBodyLanguageScore(poseAnalysis: any): number {
  let score = 70; // Base score
  
  // Extract percentages from gesture data
  const smilePercentage = extractPercentage(poseAnalysis.smiles);
  const eyeContactPercentage = extractPercentage(poseAnalysis.eye_contact);
  const handMovementPercentage = extractPercentage(poseAnalysis.hand_moves);
  
  // Smile scoring (ideal: 20-60%)
  if (smilePercentage >= 20 && smilePercentage <= 60) score += 15;
  else if (smilePercentage < 10) score -= 10;
  
  // Eye contact scoring (ideal: 60-80%)
  if (eyeContactPercentage >= 60) score += 10;
  else if (eyeContactPercentage < 30) score -= 15;
  
  // Hand movement scoring (ideal: 30-70%)
  if (handMovementPercentage >= 30 && handMovementPercentage <= 70) score += 10;
  else if (handMovementPercentage < 10) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateOverallScore(transcript: any, poseAnalysis: any): number {
  const vocalScore = poseAnalysis?.audio ? calculateVocalScore(poseAnalysis.audio) : 0;
  const wordScore = transcript ? calculateWordPowerScore(transcript) : 0;
  const bodyScore = poseAnalysis ? calculateBodyLanguageScore(poseAnalysis) : 0;
  
  // Weighted average: 30% vocal, 40% word power, 30% body language
  return Math.round((vocalScore * 0.3) + (wordScore * 0.4) + (bodyScore * 0.3));
}

function extractPercentage(gestureString: string): number {
  const match = gestureString?.match(/\((\d+(?:\.\d+)?)%\)/);
  return match ? parseFloat(match[1]) : 0;
}

function extractMinPitch(pitchRange: string): number {
  const match = pitchRange?.match(/(\d+)–(\d+) Hz/);
  return match ? parseInt(match[1]) : 0;
}

function extractMaxPitch(pitchRange: string): number {
  const match = pitchRange?.match(/(\d+)–(\d+) Hz/);
  return match ? parseInt(match[2]) : 0;
}

function calculateSpeakingPercentage(spokenDuration: number, totalDuration: number): number {
  return totalDuration > 0 ? Math.round((spokenDuration / totalDuration) * 100) : 0;
}

function calculateAvgPauseLength(numPauses: number, totalDuration: number, spokenDuration: number): number {
  const pauseDuration = totalDuration - spokenDuration;
  return numPauses > 0 ? pauseDuration / numPauses : 0;
}

function calculateClarity(volume: number): number {
  if (volume >= 50 && volume <= 70) return 85;
  if (volume >= 40 && volume <= 80) return 70;
  return 55;
}

function calculateFluency(pauses: number, duration: number): number {
  const pausesPerMinute = pauses / (duration / 60);
  if (pausesPerMinute <= 2) return 90;
  if (pausesPerMinute <= 4) return 75;
  return 60;
}

function getEnergyLevel(volume: number): string {
  if (volume >= 65) return 'High';
  if (volume >= 50) return 'Medium';
  return 'Low';
}

function calculateModulation(pitchRange: number): number {
  if (pitchRange > 100) return 85;
  if (pitchRange > 50) return 70;
  return 55;
}

function getProjectionLevel(volume: number): string {
  if (volume >= 60) return 'Strong';
  if (volume >= 45) return 'Adequate';
  return 'Weak';
}

function parseGestureData(gestureString: string, description: string) {
  const count = parseInt(gestureString?.match(/(\d+)/)?.[1] || '0');
  const percentage = extractPercentage(gestureString);
  
  return {
    count,
    percentage,
    description,
    effectiveness: percentage > 50 ? 'Good' : percentage > 25 ? 'Moderate' : 'Needs Improvement',
    engagement: percentage > 60 ? 'High' : percentage > 30 ? 'Medium' : 'Low',
    stability: percentage < 80 ? 'Stable' : 'Active'
  };
}

function calculatePostureScore(poseAnalysis: any): number {
  // Base score influenced by overall movement patterns
  const legMovement = extractPercentage(poseAnalysis.leg_moves);
  const footMovement = extractPercentage(poseAnalysis.foot_moves);
  
  if (legMovement < 20 && footMovement < 20) return 85; // Stable posture
  if (legMovement < 40 && footMovement < 40) return 70; // Good posture
  return 55; // Needs improvement
}

function getStabilityLevel(poseAnalysis: any): string {
  const totalMovement = extractPercentage(poseAnalysis.leg_moves) + extractPercentage(poseAnalysis.foot_moves);
  if (totalMovement < 30) return 'Very Stable';
  if (totalMovement < 60) return 'Stable';
  return 'Active';
}

function getConfidenceLevel(poseAnalysis: any): string {
  const smilePercentage = extractPercentage(poseAnalysis.smiles);
  const eyeContactPercentage = extractPercentage(poseAnalysis.eye_contact);
  
  const confidenceScore = (smilePercentage + eyeContactPercentage) / 2;
  
  if (confidenceScore >= 60) return 'High';
  if (confidenceScore >= 40) return 'Moderate';
  return 'Building';
}

function generateVocalStrengths(audio: any): string[] {
  const strengths = [];
  
  if (audio.volume_db >= 50 && audio.volume_db <= 70) {
    strengths.push('Clear and audible voice projection');
  }
  
  const pitchRange = extractMaxPitch(audio.pitch_range) - extractMinPitch(audio.pitch_range);
  if (pitchRange > 100) {
    strengths.push('Good vocal variety and expressiveness');
  }
  
  if (audio.num_pauses <= (audio.duration_sec / 20)) {
    strengths.push('Smooth and confident delivery');
  }
  
  return strengths;
}

function generateVocalImprovements(audio: any): string[] {
  const improvements = [];
  
  if (audio.volume_db < 50) {
    improvements.push('Increase voice projection and volume');
  }
  
  const pitchRange = extractMaxPitch(audio.pitch_range) - extractMinPitch(audio.pitch_range);
  if (pitchRange < 50) {
    improvements.push('Add more vocal variety and expressiveness');
  }
  
  const pausesPerMinute = audio.num_pauses / (audio.duration_sec / 60);
  if (pausesPerMinute > 4) {
    improvements.push('Reduce excessive pauses for better flow');
  }
  
  return improvements;
}

function generateVocalVerdict(audio: any): string {
  const score = calculateVocalScore(audio);
  
  if (score >= 80) return 'Excellent vocal delivery with strong presence';
  if (score >= 70) return 'Good vocal skills with room for refinement';
  if (score >= 60) return 'Developing vocal abilities, keep practicing';
  return 'Focus on building vocal confidence and clarity';
}

function generateBodyLanguageStrengths(poseAnalysis: any): string[] {
  const strengths = [];
  
  if (extractPercentage(poseAnalysis.smiles) >= 30) {
    strengths.push('Engaging facial expressions');
  }
  
  if (extractPercentage(poseAnalysis.eye_contact) >= 50) {
    strengths.push('Good audience connection');
  }
  
  if (extractPercentage(poseAnalysis.hand_moves) >= 30) {
    strengths.push('Expressive gestures');
  }
  
  return strengths;
}

function generateBodyLanguageImprovements(poseAnalysis: any): string[] {
  const improvements = [];
  
  if (extractPercentage(poseAnalysis.smiles) < 20) {
    improvements.push('Add more facial expressiveness');
  }
  
  if (extractPercentage(poseAnalysis.eye_contact) < 40) {
    improvements.push('Increase eye contact with audience');
  }
  
  if (extractPercentage(poseAnalysis.hand_moves) < 20) {
    improvements.push('Use more purposeful hand gestures');
  }
  
  return improvements;
}

function generateBodyLanguageVerdict(poseAnalysis: any): string {
  const score = calculateBodyLanguageScore(poseAnalysis);
  
  if (score >= 80) return 'Confident and engaging body language';
  if (score >= 70) return 'Good non-verbal communication skills';
  if (score >= 60) return 'Developing body language awareness';
  return 'Focus on building confident physical presence';
}

function getPerformanceLevel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Advanced';
  if (score >= 65) return 'Proficient';
  if (score >= 55) return 'Developing';
  return 'Beginning';
}

function generatePerformanceTitle(score: number): string {
  if (score >= 85) return 'Outstanding Performance!';
  if (score >= 75) return 'Strong Performance';
  if (score >= 65) return 'Good Performance';
  if (score >= 55) return 'Developing Skills';
  return 'Building Foundation';
}

function generatePerformanceMessage(score: number): string {
  if (score >= 85) return 'You demonstrate excellent communication skills across all areas. Continue refining your natural abilities.';
  if (score >= 75) return 'You show strong communication fundamentals with clear areas of strength. Focus on consistency.';
  if (score >= 65) return 'You have good foundational skills. With focused practice, you can reach the next level.';
  if (score >= 55) return 'You are developing your communication abilities. Regular practice will build confidence.';
  return 'You are building important communication foundations. Keep practicing and stay consistent.';
}

function combineAllStrengths(transcript: any, poseAnalysis: any): string[] {
  const strengths = [];
  
  // Add top performing areas
  const vocalScore = poseAnalysis?.audio ? calculateVocalScore(poseAnalysis.audio) : 0;
  const wordScore = transcript ? calculateWordPowerScore(transcript) : 0;
  const bodyScore = poseAnalysis ? calculateBodyLanguageScore(poseAnalysis) : 0;
  
  if (vocalScore >= 75) strengths.push('Strong vocal delivery');
  if (wordScore >= 75) strengths.push('Effective word choice and content');
  if (bodyScore >= 75) strengths.push('Confident body language');
  
  return strengths;
}

function combineAllImprovements(transcript: any, poseAnalysis: any): string[] {
  const improvements = [];
  
  const vocalScore = poseAnalysis?.audio ? calculateVocalScore(poseAnalysis.audio) : 0;
  const wordScore = transcript ? calculateWordPowerScore(transcript) : 0;
  const bodyScore = poseAnalysis ? calculateBodyLanguageScore(poseAnalysis) : 0;
  
  if (vocalScore < 70) improvements.push('Enhance vocal variety and projection');
  if (wordScore < 70) improvements.push('Reduce filler words and improve content structure');
  if (bodyScore < 70) improvements.push('Develop more confident body language');
  
  return improvements;
}

function calculateFillerPercentage(fillerWords: any[], transcript: string): number {
  if (!fillerWords || !transcript) return 0;
  
  const totalWords = transcript.split(' ').length;
  const fillerCount = fillerWords.reduce((sum, filler) => sum + (filler.count || 0), 0);
  
  return totalWords > 0 ? Math.round((fillerCount / totalWords) * 100) : 0;
}

function calculateAvgWordsPerSentence(transcript: string): number {
  if (!transcript) return 0;
  
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = transcript.split(' ').length;
  
  return sentences.length > 0 ? Math.round(words / sentences.length) : 0;
}

function countTransitionWords(transcript: string): number {
  if (!transcript) return 0;
  
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently', 'meanwhile', 'nevertheless'];
  const text = transcript.toLowerCase();
  
  return transitionWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function extractPracticeExercises(suggestions: string): string[] {
  // Extract actionable practice items from coaching suggestions
  const exercises = [];
  
  if (suggestions?.includes('practice')) {
    exercises.push('Record yourself speaking for 2 minutes daily');
  }
  
  if (suggestions?.includes('gesture') || suggestions?.includes('hand')) {
    exercises.push('Practice speaking with deliberate hand gestures in front of a mirror');
  }
  
  if (suggestions?.includes('eye contact')) {
    exercises.push('Practice maintaining eye contact by focusing on different points in the room');
  }
  
  if (suggestions?.includes('voice') || suggestions?.includes('vocal')) {
    exercises.push('Practice vocal warm-ups and breathing exercises');
  }
  
  return exercises.length > 0 ? exercises : ['Continue practicing regular speaking exercises'];
}

function extractQuickWins(suggestions: string): string[] {
  // Extract quick improvement items
  const quickWins = [];
  
  if (suggestions?.includes('smile')) {
    quickWins.push('Smile more frequently during presentations');
  }
  
  if (suggestions?.includes('volume') || suggestions?.includes('louder')) {
    quickWins.push('Speak with slightly more volume');
  }
  
  if (suggestions?.includes('pause')) {
    quickWins.push('Use strategic pauses for emphasis');
  }
  
  return quickWins.length > 0 ? quickWins : ['Focus on maintaining good posture'];
}

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
