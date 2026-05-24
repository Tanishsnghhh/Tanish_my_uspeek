import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentWorkReport extends Document {
  _id: mongoose.Types.ObjectId;
  assignment_employee_id: mongoose.Types.ObjectId;
  employee_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  content: string;
  attachments?: string[];
  work_date: Date;
  hours_spent?: number;
  tags?: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submitted_by_employee?: boolean;
  submitted_by_admin?: boolean;
  submitted_by_user_id?: mongoose.Types.ObjectId;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const AssignmentWorkReportSchema = new Schema<IAssignmentWorkReport>({
  assignment_employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentEmployee',
    required: true,
    index: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
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
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: String,
    trim: true
  }],
  work_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  hours_spent: {
    type: Number,
    min: 0,
    max: 24
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'SUBMITTED'
  },
  submitted_by_employee: {
    type: Boolean,
    default: false,
    index: true
  },
  submitted_by_admin: {
    type: Boolean,
    default: false,
    index: true
  },
  submitted_by_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  submitted_at: {
    type: Date
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Auto-populate corporate_account_id from account_id
AssignmentWorkReportSchema.pre('save', function(next) {
  // Auto-populate corporate_account_id from account_id if not set
  if (!this.corporate_account_id && this.account_id) {
    this.corporate_account_id = this.account_id;
  }
  next();
});

// Indexes for efficient queries
AssignmentWorkReportSchema.index({ assignment_employee_id: 1, created_at: -1 });
AssignmentWorkReportSchema.index({ employee_id: 1, work_date: -1 });
AssignmentWorkReportSchema.index({ account_id: 1, created_at: -1 });
AssignmentWorkReportSchema.index({ corporate_account_id: 1 }); // Index for corporate account filtering

// Force model refresh to ensure new schema is used
const modelName = 'AssignmentWorkReport';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<IAssignmentWorkReport>(modelName, AssignmentWorkReportSchema);
