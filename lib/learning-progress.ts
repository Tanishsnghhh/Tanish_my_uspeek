/**
 * Learning Progress Management Utilities
 * Handles tracking and persistence of learning material progress
 */

import { ILearningProgress } from '@/lib/models';
import connectDB from '@/lib/database';

/**
 * Get the LearningProgress model, ensuring mongoose is connected
 */
async function getLearningProgressModel() {
  await connectDB(); // Ensure database connection
  
  // Import the model dynamically after connection
  const { default: model } = await import('@/lib/models/LearningProgress');
  if (!model) {
    throw new Error('LearningProgress model not available');
  }
  return model;
}

interface VideoProgressData {
  watched_duration: number;
  total_duration: number;
  completion_percentage: number;
  is_completed: boolean;
}

interface QuizAttemptData {
  score: number;
  total_questions: number;
  correct_answers: number;
  answers: number[];
  time_taken: number;
}

interface OverallCompletionData {
  is_completed: boolean;
  total_sessions_completed: number;
  total_sessions: number;
}

/**
 * Save video progress for a learning session
 */
export async function saveVideoProgress(
  userId: string,
  materialId: string,
  sessionId: string,
  videoProgress: VideoProgressData
): Promise<ILearningProgress | null> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.findOneAndUpdate(
      {
        user_id: userId,
        material_id: materialId
      },
      {
        $set: {
          [`video_progress.${sessionId}`]: {
            ...videoProgress,
            last_watched_at: new Date()
          },
          updated_at: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Saved video progress for ${materialId}:${sessionId}`);
    return progress;
  } catch (error) {
    console.error('❌ Error saving video progress:', error);
    return null;
  }
}

/**
 * Save quiz attempt for a learning session
 */
export async function saveQuizAttempt(
  userId: string,
  materialId: string,
  sessionId: string,
  quizAttempt: QuizAttemptData
): Promise<ILearningProgress | null> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.findOne({
      user_id: userId,
      material_id: materialId
    });

    const attemptNumber = progress && progress.quiz_attempts[sessionId] 
      ? progress.quiz_attempts[sessionId].length + 1 
      : 1;

    const updateData = {
      [`quiz_attempts.${sessionId}`]: progress && progress.quiz_attempts[sessionId]
        ? [...progress.quiz_attempts[sessionId], {
            attempt_number: attemptNumber,
            ...quizAttempt,
            attempted_at: new Date()
          }]
        : [{
            attempt_number: attemptNumber,
            ...quizAttempt,
            attempted_at: new Date()
          }],
      updated_at: new Date()
    };

    const updatedProgress = await LearningProgressModel.findOneAndUpdate(
      {
        user_id: userId,
        material_id: materialId
      },
      {
        $set: updateData
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Saved quiz attempt for ${materialId}:${sessionId}`);
    return updatedProgress;
  } catch (error) {
    console.error('❌ Error saving quiz attempt:', error);
    return null;
  }
}

/**
 * Get user's progress for a specific material
 */
export async function getMaterialProgress(
  userId: string,
  materialId: string
): Promise<ILearningProgress[]> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.find({
      user_id: userId,
      material_id: materialId
    }).sort({ updated_at: -1 });

    return progress;
  } catch (error) {
    console.error('❌ Error fetching material progress:', error);
    return [];
  }
}

/**
 * Get user's progress for a specific session
 */
export async function getSessionProgress(
  userId: string,
  materialId: string,
  sessionId: string
): Promise<ILearningProgress | null> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.findOne({
      user_id: userId,
      material_id: materialId
    });

    return progress;
  } catch (error) {
    console.error('❌ Error fetching session progress:', error);
    return null;
  }
}

/**
 * Get overall progress for a material (completion stats)
 */
export async function getMaterialCompletionStats(
  userId: string,
  materialId: string
): Promise<{
  total_sessions: number;
  completed_sessions: number;
  completion_percentage: number;
  total_quiz_attempts: number;
  average_quiz_score: number;
}> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.findOne({
      user_id: userId,
      material_id: materialId
    });

    if (!progress) {
      return {
        total_sessions: 40, // Hardcoded total sessions
        completed_sessions: 0,
        completion_percentage: 0,
        total_quiz_attempts: 0,
        average_quiz_score: 0
      };
    }

    // Convert to plain object to avoid Mongoose weirdness with Object.keys
    const videoProgress = JSON.parse(JSON.stringify(progress.video_progress || {}));
    const quizAttempts = JSON.parse(JSON.stringify(progress.quiz_attempts || {}));
    
    const videoProgressKeys = Object.keys(videoProgress);
    const quizAttemptsKeys = Object.keys(quizAttempts);
    const allSessionKeys = new Set([...videoProgressKeys, ...quizAttemptsKeys]);
    
    const total_sessions = 40; // Hardcoded total sessions
    let completed_sessions = 0;
    let total_quiz_attempts = 0;
    let all_quiz_scores: number[] = [];

    for (const sessionId of allSessionKeys) {
      const sessionVideoProgress = videoProgress[sessionId];
      const sessionQuizAttempts = quizAttempts[sessionId] || [];
      
      // Count as completed if video is completed (regardless of quiz)
      if (sessionVideoProgress?.is_completed) {
        completed_sessions++;
      }
      
      total_quiz_attempts += sessionQuizAttempts.length;
      all_quiz_scores.push(...sessionQuizAttempts.map((attempt: any) => attempt.score));
    }

    const completion_percentage = total_sessions > 0
      ? Math.round((completed_sessions / total_sessions) * 100)
      : 0;

    const average_quiz_score = all_quiz_scores.length > 0
      ? Math.round(all_quiz_scores.reduce((sum, score) => sum + score, 0) / all_quiz_scores.length)
      : 0;

    return {
      total_sessions,
      completed_sessions,
      completion_percentage,
      total_quiz_attempts,
      average_quiz_score
    };
  } catch (error) {
    console.error('❌ Error fetching material completion stats:', error);
    return {
      total_sessions: 0,
      completed_sessions: 0,
      completion_percentage: 0,
      total_quiz_attempts: 0,
      average_quiz_score: 0
    };
  }
}

/**
 * Update overall completion status
 */
export async function updateOverallCompletion(
  userId: string,
  materialId: string,
  completionData: OverallCompletionData
): Promise<boolean> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const updateData: any = {
      'overall_completion': completionData,
      updated_at: new Date()
    };

    if (completionData.is_completed) {
      updateData['overall_completion.completed_at'] = new Date();
    }

    await LearningProgressModel.findOneAndUpdate(
      {
        user_id: userId,
        material_id: materialId
      },
      {
        $set: updateData
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Updated overall completion for ${materialId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating overall completion:', error);
    return false;
  }
}

/**
 * Get all learning progress for a user
 */
export async function getUserLearningProgress(userId: string): Promise<ILearningProgress[]> {
  try {
    const LearningProgressModel = await getLearningProgressModel();
    
    const progress = await LearningProgressModel.find({
      user_id: userId
    }).sort({ updated_at: -1 });

    return progress;
  } catch (error) {
    console.error('❌ Error fetching user learning progress:', error);
    return [];
  }
}
