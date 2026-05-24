import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

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

/**
 * Get user from request - either from JWT token or session
 */
async function getUserFromRequest(request: NextRequest) {
  // Try to get token from header first
  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader || '');

  if (token) {
    // Verify JWT token
    const decoded = await verifyToken(token);
    if (decoded) {
      return decoded;
    }
  }

  // If no valid token, try to get user from session/cookies
  // For now, we'll require token but this could be extended to support session-based auth
  return null;
}

// GET /api/learning-progress - Get user's learning progress
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from request (supports both JWT and session-based auth)
    const decoded = await getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('material_id');
    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '50'); // Default limit of 50

    let query: any = { user_id: decoded.userId };

    if (materialId) {
      query.material_id = materialId;
    }

    // Get progress data
    const LearningProgressModel = await getLearningProgressModel();
    const progress = await LearningProgressModel.find(query)
      .sort({ updated_at: -1 })
      .limit(limit);

    // If sessionId is specified, filter the results to only include that session's data
    let filteredProgress: any[] = progress;
    if (sessionId && progress.length > 0) {
      filteredProgress = progress.map((doc: any) => {
        const docObj = doc.toObject ? doc.toObject() : doc;
        const filteredDoc = { ...docObj };

        if (filteredDoc.video_progress && filteredDoc.video_progress[sessionId]) {
          filteredDoc.video_progress = { [sessionId]: filteredDoc.video_progress[sessionId] };
        } else {
          filteredDoc.video_progress = {};
        }

        if (filteredDoc.quiz_attempts && filteredDoc.quiz_attempts[sessionId]) {
          filteredDoc.quiz_attempts = { [sessionId]: filteredDoc.quiz_attempts[sessionId] };
        } else {
          filteredDoc.quiz_attempts = {};
        }

        return filteredDoc;
      });
    }

    return NextResponse.json({
      success: true,
      progress: filteredProgress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching learning progress:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch learning progress'
    }, { status: 500 });
  }
}

// POST /api/learning-progress - Update or create learning progress
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get user from request (supports both JWT and session-based auth)
    const decoded = await getUserFromRequest(request);
    if (!decoded) {
      console.log('❌ No user found in request');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📥 Received progress update:', body);

    const {
      material_id,
      session_id,
      video_progress,
      quiz_attempt,
      overall_completion
    } = body;

    if (!material_id) {
      console.log('❌ No material_id provided');
      return NextResponse.json({
        error: 'material_id is required'
      }, { status: 400 });
    }

    // Find existing progress or create new one
    const LearningProgressModel = await getLearningProgressModel();
    let progress = await LearningProgressModel.findOne({
      user_id: decoded.userId,
      material_id
    });

    console.log('📊 Found existing progress:', !!progress);

    if (!progress) {
      progress = new LearningProgressModel({
        user_id: decoded.userId,
        account_id: decoded.corporateAccountId || decoded.userId, // fallback
        corporate_account_id: decoded.corporateAccountId || decoded.userId, // Include corporate account ID
        material_id,
        video_progress: {},
        quiz_attempts: {},
        overall_completion: {
          is_completed: false,
          total_sessions_completed: 0,
          total_sessions: 40 // Hardcoded total sessions
        }
      });
    }

    // Update video progress if provided and session_id is specified
    if (video_progress && session_id) {
      console.log('🎥 Updating video progress for session:', session_id, video_progress);

      const currentVideoProgress = progress.video_progress[session_id] || {
        watched_duration: 0,
        total_duration: 0,
        completion_percentage: 0,
        last_watched_at: new Date(),
        is_completed: false
      };

      progress.video_progress[session_id] = {
        ...currentVideoProgress,
        ...video_progress,
        last_watched_at: new Date()
      };
      progress.markModified('video_progress');

      // Auto-update overall completion based on video progress
      const videoProgressKeys = Object.keys(progress.video_progress);
      const total_sessions = 40; // Hardcoded total sessions
      let total_sessions_completed = 0;

      for (const sessionKey of videoProgressKeys) {
        if (progress.video_progress[sessionKey]?.is_completed) {
          total_sessions_completed++;
        }
      }

      const is_overall_completed = total_sessions_completed === total_sessions;

      progress.overall_completion = {
        ...progress.overall_completion,
        total_sessions,
        total_sessions_completed,
        is_completed: is_overall_completed
      };

      if (is_overall_completed && !progress.overall_completion.completed_at) {
        progress.overall_completion.completed_at = new Date();
      }

      console.log('📊 Updated overall completion:', {
        total_sessions,
        total_sessions_completed,
        is_completed: is_overall_completed
      });
    }

    // Add quiz attempt if provided and session_id is specified
    if (quiz_attempt && session_id) {
      const sessionAttempts = progress.quiz_attempts[session_id] || [];
      const attemptNumber = sessionAttempts.length + 1;
      sessionAttempts.push({
        attempt_number: attemptNumber,
        ...quiz_attempt,
        attempted_at: new Date()
      });
      progress.quiz_attempts[session_id] = sessionAttempts;
      progress.markModified('quiz_attempts');
    }

    // Update overall completion if provided
    if (overall_completion) {
      progress.overall_completion = {
        ...progress.overall_completion,
        ...overall_completion
      };

      if (overall_completion.is_completed && !progress.overall_completion.completed_at) {
        progress.overall_completion.completed_at = new Date();
      }
    }

    await progress.save();
    console.log('💾 Progress saved successfully:', {
      material_id,
      session_id,
      video_progress: progress.video_progress[session_id]
    });

    return NextResponse.json({
      success: true,
      progress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating learning progress:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update learning progress'
    }, { status: 500 });
  }
}

// PUT /api/learning-progress - Bulk update progress
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Get user from request (supports both JWT and session-based auth)
    const decoded = await getUserFromRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json({
        error: 'updates must be an array'
      }, { status: 400 });
    }

    const results = [];

    for (const update of updates) {
      const {
        material_id,
        session_id,
        video_progress,
        quiz_attempt,
        overall_completion
      } = update;

      if (!material_id) {
        continue; // Skip invalid updates
      }

      const LearningProgressModel = await getLearningProgressModel();
      let progress = await LearningProgressModel.findOne({
        user_id: decoded.userId,
        material_id
      });

      if (!progress) {
        progress = new LearningProgressModel({
          user_id: decoded.userId,
          account_id: decoded.corporateAccountId || decoded.userId,
          corporate_account_id: decoded.corporateAccountId || decoded.userId, // Include corporate account ID
          material_id,
          video_progress: {},
          quiz_attempts: {},
          overall_completion: {
            is_completed: false,
            total_sessions_completed: 0,
            total_sessions: 40 // Hardcoded total sessions
          }
        });
      }

      // Update fields as in POST
      if (video_progress && session_id) {
        const currentVideoProgress = progress.video_progress[session_id] || {
          watched_duration: 0,
          total_duration: 0,
          completion_percentage: 0,
          last_watched_at: new Date(),
          is_completed: false
        };

        progress.video_progress[session_id] = {
          ...currentVideoProgress,
          ...video_progress,
          last_watched_at: new Date()
        };
        progress.markModified('video_progress');

        // Auto-update overall completion based on video progress
        const videoProgressKeys = Object.keys(progress.video_progress);
        const total_sessions = 40; // Hardcoded total sessions
        let total_sessions_completed = 0;

        for (const sessionKey of videoProgressKeys) {
          if (progress.video_progress[sessionKey]?.is_completed) {
            total_sessions_completed++;
          }
        }

        const is_overall_completed = total_sessions_completed === total_sessions;

        progress.overall_completion = {
          ...progress.overall_completion,
          total_sessions,
          total_sessions_completed,
          is_completed: is_overall_completed
        };

        if (is_overall_completed && !progress.overall_completion.completed_at) {
          progress.overall_completion.completed_at = new Date();
        }

        console.log('📊 Updated overall completion:', {
          total_sessions,
          total_sessions_completed,
          is_completed: is_overall_completed
        });
      }

      if (quiz_attempt && session_id) {
        const sessionAttempts = progress.quiz_attempts[session_id] || [];
        const attemptNumber = sessionAttempts.length + 1;
        sessionAttempts.push({
          attempt_number: attemptNumber,
          ...quiz_attempt,
          attempted_at: new Date()
        });
        progress.quiz_attempts[session_id] = sessionAttempts;
        progress.markModified('quiz_attempts');
      }

      if (overall_completion) {
        progress.overall_completion = {
          ...progress.overall_completion,
          ...overall_completion
        };

        if (overall_completion.is_completed && !progress.overall_completion.completed_at) {
          progress.overall_completion.completed_at = new Date();
        }
      }

      await progress.save();
      results.push(progress);
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error bulk updating learning progress:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to bulk update learning progress'
    }, { status: 500 });
  }
}
