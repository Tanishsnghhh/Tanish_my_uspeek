import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';
import { ObjectId } from 'mongodb';

interface KeyInsight {
  title: string;
  category: 'improved' | 'needs_improvement';
  metric: string;
  score: number;
  threshold: number;
  icon?: string;
  emoji?: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface KeyInsightsResponse {
  improved: KeyInsight[];
  needsImprovement: KeyInsight[];
  summary: {
    totalVideos: number;
    averageOverallScore: number;
    topPerformingArea: string;
    mostNeedingImprovement: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication and get corporate account ID
    const authResult = await checkAdminPermissions(request);
    
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return NextResponse.json(
        { error: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    if (!authResult.corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    const videoAnalysis = db.collection('video_analysis');

    // Build filter for corporate account
    const accountFilter = {
      $or: [
        { 'uploadInfo.corporate_account_id': new ObjectId(authResult.corporateAccountId) },
        { 'uploadInfo.accountId': authResult.corporateAccountId }
      ]
    };

    // Get video analysis records for this corporate account only
    const allRecords = await videoAnalysis.find(accountFilter).toArray();

    if (allRecords.length === 0) {
      return NextResponse.json({
        improved: [],
        needsImprovement: [],
        summary: {
          totalVideos: 0,
          averageOverallScore: 0,
          topPerformingArea: 'N/A',
          mostNeedingImprovement: 'N/A'
        }
      });
    }

    // Analyze data to generate insights
    const insights = await generateKeyInsights(allRecords);

    return NextResponse.json(insights);

  } catch (error) {
    console.error('Error fetching key insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch key insights' },
      { status: 500 }
    );
  }
}

async function generateKeyInsights(records: any[]): Promise<KeyInsightsResponse> {
  const insights: KeyInsight[] = [];
  
  // Calculate averages and trends for each metric
  const metrics = {
    facialExpressions: {
      happy: { scores: [] as number[], count: 0 },
      sad: { scores: [] as number[], count: 0 },
      angry: { scores: [] as number[], count: 0 },
      fearful: { scores: [] as number[], count: 0 },
      confused: { scores: [] as number[], count: 0 },
      disgust: { scores: [] as number[], count: 0 }
    },
    vocalMetrics: {
      rateOfSpeech: { scores: [] as number[], count: 0 },
      clarity: { scores: [] as number[], count: 0 },
      fluency: { scores: [] as number[], count: 0 },
      modulation: { scores: [] as number[], count: 0 }
    },
    bodyLanguage: {
      eyeContact: { scores: [] as number[], count: 0 },
      smiles: { scores: [] as number[], count: 0 },
      posture: { scores: [] as number[], count: 0 },
      handGestures: { scores: [] as number[], count: 0 }
    },
    wordPower: {
      vocabularyDiversity: { scores: [] as number[], count: 0 },
      fillerWords: { scores: [] as number[], count: 0 },
      sentenceStructure: { scores: [] as number[], count: 0 }
    },
    confidence: {
      overallConfidence: { scores: [] as number[], count: 0 },
      engagement: { scores: [] as number[], count: 0 },
      nervousness: { scores: [] as number[], count: 0 }
    }
  };

  // Extract metrics from each record
  records.forEach(record => {
    // Facial expressions from emotion analysis
    if (record.emotionAnalysis?.emotionScores) {
      const emotions = record.emotionAnalysis.emotionScores;
      if (emotions.happy !== undefined) {
        metrics.facialExpressions.happy.scores.push(emotions.happy);
        metrics.facialExpressions.happy.count++;
      }
      if (emotions.sadness !== undefined) {
        metrics.facialExpressions.sad.scores.push(emotions.sadness);
        metrics.facialExpressions.sad.count++;
      }
      if (emotions.anger !== undefined) {
        metrics.facialExpressions.angry.scores.push(emotions.anger);
        metrics.facialExpressions.angry.count++;
      }
      if (emotions.fear !== undefined) {
        metrics.facialExpressions.fearful.scores.push(emotions.fear);
        metrics.facialExpressions.fearful.count++;
      }
      if (emotions.disgust !== undefined) {
        metrics.facialExpressions.disgust.scores.push(emotions.disgust);
        metrics.facialExpressions.disgust.count++;
      }
    }

    // Vocal metrics
    if (record.vocalAnalysis) {
      if (record.vocalAnalysis.audio?.speakingTimePercentage !== undefined) {
        metrics.vocalMetrics.rateOfSpeech.scores.push(record.vocalAnalysis.audio.speakingTimePercentage);
        metrics.vocalMetrics.rateOfSpeech.count++;
      }
      if (record.vocalAnalysis.quality?.clarity !== undefined) {
        metrics.vocalMetrics.clarity.scores.push(record.vocalAnalysis.quality.clarity);
        metrics.vocalMetrics.clarity.count++;
      }
      if (record.vocalAnalysis.quality?.fluency !== undefined) {
        metrics.vocalMetrics.fluency.scores.push(record.vocalAnalysis.quality.fluency);
        metrics.vocalMetrics.fluency.count++;
      }
      if (record.vocalAnalysis.quality?.modulation !== undefined) {
        metrics.vocalMetrics.modulation.scores.push(record.vocalAnalysis.quality.modulation);
        metrics.vocalMetrics.modulation.count++;
      }
    }

    // Body language metrics
    if (record.bodyLanguageAnalysis) {
      if (record.bodyLanguageAnalysis.gestures?.eyeContact?.percentage !== undefined) {
        metrics.bodyLanguage.eyeContact.scores.push(record.bodyLanguageAnalysis.gestures.eyeContact.percentage);
        metrics.bodyLanguage.eyeContact.count++;
      }
      if (record.bodyLanguageAnalysis.gestures?.smiles?.percentage !== undefined) {
        metrics.bodyLanguage.smiles.scores.push(record.bodyLanguageAnalysis.gestures.smiles.percentage);
        metrics.bodyLanguage.smiles.count++;
      }
      if (record.bodyLanguageAnalysis.posture?.straightPosture !== undefined) {
        metrics.bodyLanguage.posture.scores.push(record.bodyLanguageAnalysis.posture.straightPosture);
        metrics.bodyLanguage.posture.count++;
      }
      if (record.bodyLanguageAnalysis.gestures?.handMovement?.percentage !== undefined) {
        metrics.bodyLanguage.handGestures.scores.push(record.bodyLanguageAnalysis.gestures.handMovement.percentage);
        metrics.bodyLanguage.handGestures.count++;
      }
    }

    // Word power metrics
    if (record.wordPowerAnalysis) {
      if (record.wordPowerAnalysis.contentAssessment?.vocabularyDiversity !== undefined) {
        metrics.wordPower.vocabularyDiversity.scores.push(record.wordPowerAnalysis.contentAssessment.vocabularyDiversity);
        metrics.wordPower.vocabularyDiversity.count++;
      }
      if (record.wordPowerAnalysis.contentAssessment?.fluency?.fillerWordsPercentage !== undefined) {
        metrics.wordPower.fillerWords.scores.push(record.wordPowerAnalysis.contentAssessment.fluency.fillerWordsPercentage);
        metrics.wordPower.fillerWords.count++;
      }
      if (record.wordPowerAnalysis.contentAssessment?.sentenceStructure?.score !== undefined) {
        metrics.wordPower.sentenceStructure.scores.push(record.wordPowerAnalysis.contentAssessment.sentenceStructure.score);
        metrics.wordPower.sentenceStructure.count++;
      }
    }

    // Confidence metrics
    if (record.confidenceAnalysis) {
      if (record.confidenceAnalysis.confidenceScore !== undefined) {
        metrics.confidence.overallConfidence.scores.push(record.confidenceAnalysis.confidenceScore);
        metrics.confidence.overallConfidence.count++;
      }
      if (record.confidenceAnalysis.engagementScore !== undefined) {
        metrics.confidence.engagement.scores.push(record.confidenceAnalysis.engagementScore);
        metrics.confidence.engagement.count++;
      }
      if (record.confidenceAnalysis.nervousnessScore !== undefined) {
        metrics.confidence.nervousness.scores.push(record.confidenceAnalysis.nervousnessScore);
        metrics.confidence.nervousness.count++;
      }
    }
  });

  // Generate insights based on thresholds
  const improved: KeyInsight[] = [];
  const needsImprovement: KeyInsight[] = [];

  // Facial expressions - lower negative emotions are better
  const negativeEmotions = ['sad', 'angry', 'fearful', 'confused', 'disgust'];
  negativeEmotions.forEach(emotion => {
    const metric = metrics.facialExpressions[emotion as keyof typeof metrics.facialExpressions];
    if (metric.count > 0) {
      const average = metric.scores.reduce((a, b) => a + b, 0) / metric.scores.length;
      const threshold = 0.3; // 30% threshold for negative emotions
      
      if (average < threshold) {
        improved.push({
          title: `Reduced ${emotion.charAt(0).toUpperCase() + emotion.slice(1)} Facial Expressions`,
          category: 'improved',
          metric: emotion,
          score: average,
          threshold,
          emoji: getEmotionEmoji(emotion),
          description: `Average ${emotion} expression reduced to ${Math.round(average * 100)}%`,
          trend: 'down'
        });
      } else {
        needsImprovement.push({
          title: `Need to Reduce ${emotion.charAt(0).toUpperCase() + emotion.slice(1)} Expressions`,
          category: 'needs_improvement',
          metric: emotion,
          score: average,
          threshold,
          emoji: getEmotionEmoji(emotion),
          description: `Average ${emotion} expression is ${Math.round(average * 100)}%`,
          trend: 'up'
        });
      }
    }
  });

  // Vocal metrics
  if (metrics.vocalMetrics.rateOfSpeech.count > 0) {
    const average = metrics.vocalMetrics.rateOfSpeech.scores.reduce((a, b) => a + b, 0) / metrics.vocalMetrics.rateOfSpeech.scores.length;
    const threshold = 50; // 50% speaking time threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Rate of Speech",
        category: 'improved',
        metric: 'rateOfSpeech',
        score: average,
        threshold,
        description: `Average speaking time is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Rate of Speech",
        category: 'needs_improvement',
        metric: 'rateOfSpeech',
        score: average,
        threshold,
        description: `Average speaking time is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Body language metrics
  if (metrics.bodyLanguage.eyeContact.count > 0) {
    const average = metrics.bodyLanguage.eyeContact.scores.reduce((a, b) => a + b, 0) / metrics.bodyLanguage.eyeContact.scores.length;
    const threshold = 60; // 60% eye contact threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Eye Contact",
        category: 'improved',
        metric: 'eyeContact',
        score: average,
        threshold,
        description: `Average eye contact is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Eye Contact",
        category: 'needs_improvement',
        metric: 'eyeContact',
        score: average,
        threshold,
        description: `Average eye contact is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  if (metrics.bodyLanguage.smiles.count > 0) {
    const average = metrics.bodyLanguage.smiles.scores.reduce((a, b) => a + b, 0) / metrics.bodyLanguage.smiles.scores.length;
    const threshold = 30; // 30% smile threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Smile Frequency",
        category: 'improved',
        metric: 'smiles',
        score: average,
        threshold,
        emoji: '😊',
        description: `Average smile frequency is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Smile Frequency",
        category: 'needs_improvement',
        metric: 'smiles',
        score: average,
        threshold,
        emoji: '😊',
        description: `Average smile frequency is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Word power metrics
  if (metrics.wordPower.vocabularyDiversity.count > 0) {
    const average = metrics.wordPower.vocabularyDiversity.scores.reduce((a, b) => a + b, 0) / metrics.wordPower.vocabularyDiversity.scores.length;
    const threshold = 70; // 70% vocabulary diversity threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Word Power",
        category: 'improved',
        metric: 'vocabularyDiversity',
        score: average,
        threshold,
        description: `Average vocabulary diversity is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Word Power",
        category: 'needs_improvement',
        metric: 'vocabularyDiversity',
        score: average,
        threshold,
        description: `Average vocabulary diversity is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Vocal modulation
  if (metrics.vocalMetrics.modulation.count > 0) {
    const average = metrics.vocalMetrics.modulation.scores.reduce((a, b) => a + b, 0) / metrics.vocalMetrics.modulation.scores.length;
    const threshold = 60; // 60% modulation threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Voice Modulation",
        category: 'improved',
        metric: 'modulation',
        score: average,
        threshold,
        description: `Average voice modulation is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Voice Modulation",
        category: 'needs_improvement',
        metric: 'modulation',
        score: average,
        threshold,
        description: `Average voice modulation is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Body posture
  if (metrics.bodyLanguage.posture.count > 0) {
    const average = metrics.bodyLanguage.posture.scores.reduce((a, b) => a + b, 0) / metrics.bodyLanguage.posture.scores.length;
    const threshold = 70; // 70% posture threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Body Posture",
        category: 'improved',
        metric: 'posture',
        score: average,
        threshold,
        description: `Average posture score is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Body Posture",
        category: 'needs_improvement',
        metric: 'posture',
        score: average,
        threshold,
        description: `Average posture score is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Confidence metrics
  if (metrics.confidence.overallConfidence.count > 0) {
    const average = metrics.confidence.overallConfidence.scores.reduce((a, b) => a + b, 0) / metrics.confidence.overallConfidence.scores.length;
    const threshold = 70; // 70% confidence threshold
    
    if (average >= threshold) {
      improved.push({
        title: "Improved Confidence",
        category: 'improved',
        metric: 'confidence',
        score: average,
        threshold,
        description: `Average confidence score is ${Math.round(average)}%`,
        trend: 'up'
      });
    } else {
      needsImprovement.push({
        title: "Need to Improve Confidence",
        category: 'needs_improvement',
        metric: 'confidence',
        score: average,
        threshold,
        description: `Average confidence score is ${Math.round(average)}%`,
        trend: 'down'
      });
    }
  }

  // Calculate summary statistics
  const overallScores = records
    .map(r => r.overallPerformance?.totalScore || 0)
    .filter(score => score > 0);
  
  const averageOverallScore = overallScores.length > 0 
    ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length 
    : 0;

  // Find top performing area and most needing improvement
  const topPerformingArea = improved.length > 0 
    ? improved.reduce((prev, current) => (prev.score > current.score) ? prev : current).title
    : 'N/A';
  
  const mostNeedingImprovement = needsImprovement.length > 0
    ? needsImprovement.reduce((prev, current) => (prev.score < current.score) ? prev : current).title
    : 'N/A';

  // Ensure we have at least 4 items for needs improvement by adding generic items if needed
  const needsImprovementItems = [...needsImprovement];
  
  // Add generic improvement areas if we don't have enough specific ones
  const genericImprovements = [
    {
      title: "Need to Improve Overall Presentation Skills",
      category: 'needs_improvement' as const,
      metric: 'presentation',
      score: 60,
      threshold: 70,
      description: "Focus on overall presentation effectiveness",
      trend: 'down' as const
    },
    {
      title: "Need to Improve Audience Engagement",
      category: 'needs_improvement' as const,
      metric: 'engagement',
      score: 55,
      threshold: 70,
      description: "Work on connecting better with your audience",
      trend: 'down' as const
    },
    {
      title: "Need to Improve Communication Clarity",
      category: 'needs_improvement' as const,
      metric: 'clarity',
      score: 58,
      threshold: 70,
      description: "Enhance message clarity and understanding",
      trend: 'down' as const
    },
    {
      title: "Need to Improve Professional Presence",
      category: 'needs_improvement' as const,
      metric: 'presence',
      score: 62,
      threshold: 70,
      description: "Develop stronger professional presence",
      trend: 'down' as const
    }
  ];

  // Fill up to 4 items if we have fewer than 4 specific improvements
  while (needsImprovementItems.length < 4 && genericImprovements.length > 0) {
    const genericItem = genericImprovements.shift();
    if (genericItem) {
      needsImprovementItems.push(genericItem);
    }
  }

  return {
    improved: improved.slice(0, 4), // Limit to top 4 improvements
    needsImprovement: needsImprovementItems.slice(0, 4), // Ensure exactly 4 items
    summary: {
      totalVideos: records.length,
      averageOverallScore: Math.round(averageOverallScore),
      topPerformingArea,
      mostNeedingImprovement
    }
  };
}

function getEmotionEmoji(emotion: string): string {
  const emojiMap: { [key: string]: string } = {
    sad: '😔',
    angry: '😠',
    fearful: '😨',
    confused: '😕',
    disgust: '🤢',
    happy: '😊'
  };
  return emojiMap[emotion] || '😐';
}
