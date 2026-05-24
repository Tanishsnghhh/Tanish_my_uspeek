import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentMaster extends Document {
  _id: mongoose.Types.ObjectId;
  assignment_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignment_type: 'LESSON' | 'VIDEO_TASK' | 'QUIZ' | 'PRESENTATION' | 'ROLE_PLAY' | 'ASSESSMENT';
  estimated_duration?: number; // in minutes
  difficulty_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags?: string[];
  is_active: boolean;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  created_at: Date;
  updated_at: Date;
}

const AssignmentMasterSchema = new Schema<IAssignmentMaster>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  assignment_type: {
    type: String,
    required: true,
    enum: ['LESSON', 'VIDEO_TASK', 'QUIZ', 'PRESENTATION', 'ROLE_PLAY', 'ASSESSMENT'],
    default: 'LESSON'
  },
  estimated_duration: {
    type: Number,
    min: 1,
    max: 480 // 8 hours max
  },
  difficulty_level: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    default: 'BEGINNER'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set assignment_id to _id before saving
AssignmentMasterSchema.pre('save', function(next) {
  this.assignment_id = this._id;
  next();
});

// Indexes for efficient queries
AssignmentMasterSchema.index({ assignment_type: 1, is_active: 1 });
AssignmentMasterSchema.index({ difficulty_level: 1 });
AssignmentMasterSchema.index({ tags: 1 });
AssignmentMasterSchema.index({ corporate_account_id: 1 }); // Index for corporate account filtering
AssignmentMasterSchema.index({ title: 'text', description: 'text' });

// Force model refresh to ensure new schema is used
const modelName = 'AssignmentMaster';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose && mongoose.model ? mongoose.model<IAssignmentMaster>(modelName, AssignmentMasterSchema) : null;
