import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeScoreHistory extends Document {
  _id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  employee_id: mongoose.Types.ObjectId;
  score: number;
  recorded_at: Date;
  created_at: Date;
}

const EmployeeScoreHistorySchema = new Schema<IEmployeeScoreHistory>({
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
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    validate: {
      validator: function(value: number) {
        return value >= 0 && value <= 100;
      },
      message: 'Score must be between 0 and 100'
    }
  },
  recorded_at: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: false 
  }
});

// Indexes for efficient queries
EmployeeScoreHistorySchema.index({ employee_id: 1, recorded_at: -1 });
EmployeeScoreHistorySchema.index({ account_id: 1, recorded_at: -1 });
EmployeeScoreHistorySchema.index({ account_id: 1, employee_id: 1, recorded_at: -1 });

// Force model refresh to ensure new schema is used
const modelName = 'EmployeeScoreHistory';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<IEmployeeScoreHistory>(modelName, EmployeeScoreHistorySchema);
