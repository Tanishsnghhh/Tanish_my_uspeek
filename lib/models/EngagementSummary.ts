import mongoose, { Schema, Document } from 'mongoose';

export interface IEngagementSummary extends Document {
  _id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  employee_id: mongoose.Types.ObjectId;
  total_lessons_completed: number;
  avg_score?: number;
  total_time_spent: number; // in minutes
  total_videos_uploaded: number;
  report_date: Date; // snapshot day
  created_at: Date;
}

const EngagementSummarySchema = new Schema<IEngagementSummary>({
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true,
    index: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
    index: true
  },
  total_lessons_completed: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  avg_score: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
    validate: {
      validator: function(value: number | null) {
        if (value === null || value === undefined) return true;
        return value >= 0 && value <= 100;
      },
      message: 'Average score must be between 0 and 100'
    }
  },
  total_time_spent: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total_videos_uploaded: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  report_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        // Ensure it's a valid date and not in the future
        return value instanceof Date && value <= new Date();
      },
      message: 'Report date must be a valid date and not in the future'
    }
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: false 
  }
});

// Compound unique index to ensure one record per employee per day
EngagementSummarySchema.index(
  { account_id: 1, employee_id: 1, report_date: 1 }, 
  { unique: true }
);

// Indexes for efficient queries
EngagementSummarySchema.index({ account_id: 1, report_date: -1 });
EngagementSummarySchema.index({ employee_id: 1, report_date: -1 });

// Force model refresh to ensure new schema is used
const modelName = 'EngagementSummary';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<IEngagementSummary>(modelName, EngagementSummarySchema);
