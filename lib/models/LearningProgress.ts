import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  material_id: string; // e.g., 'storytelling', 'empathy', etc.
  video_progress: {
    [session_id: string]: {
      watched_duration: number; // in seconds
      total_duration: number; // in seconds
      completion_percentage: number; // 0-100
      last_watched_at: Date;
      is_completed: boolean;
    };
  };
  quiz_attempts: {
    [session_id: string]: {
      attempt_number: number;
      score: number; // percentage 0-100
      total_questions: number;
      correct_answers: number;
      answers: number[]; // array of selected answer indices
      attempted_at: Date;
      time_taken: number; // in seconds
    }[];
  };
  overall_completion: {
    is_completed: boolean;
    completed_at?: Date;
    total_sessions_completed: number;
    total_sessions: number;
  };
  created_at: Date;
  updated_at: Date;
}

const LearningProgressSchema = new Schema<ILearningProgress>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true,
    index: true
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: false // Will be auto-populated by pre-save hook
  },
  material_id: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  video_progress: {
    type: Object,
    default: {}
  },
  quiz_attempts: {
    type: Object,
    default: {}
  },
  overall_completion: {
    is_completed: {
      type: Boolean,
      default: false
    },
    completed_at: {
      type: Date
    },
    total_sessions_completed: {
      type: Number,
      default: 0,
      min: 0
    },
    total_sessions: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Auto-populate corporate_account_id from account_id
LearningProgressSchema.pre('save', function(next) {
  // Always ensure corporate_account_id is set from account_id
  if (this.account_id) {
    this.corporate_account_id = this.account_id;
  }
  next();
});

// Compound indexes for efficient queries
LearningProgressSchema.index({ user_id: 1, material_id: 1 }, { unique: true });
LearningProgressSchema.index({ account_id: 1, material_id: 1 });
LearningProgressSchema.index({ user_id: 1, updated_at: -1 });
LearningProgressSchema.index({ corporate_account_id: 1 }); // Index for corporate account filtering

// Force model refresh to ensure new schema is used
const modelName = 'LearningProgress';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose && mongoose.model ? mongoose.model<ILearningProgress>(modelName, LearningProgressSchema) : null;
