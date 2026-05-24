import mongoose, { Document, Schema } from 'mongoose';

export interface IInstanceWorkReport extends Document {
  instance_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  employee_id?: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  content: string;
  work_date: string;
  hours_spent?: number;
  tags?: string[];
  link?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
  submitted_at?: Date;
  submitted_by_user_id?: mongoose.Types.ObjectId; // Track who actually submitted it
  submitted_by_admin?: boolean; // Flag to indicate admin submission
  submitted_by_employee?: boolean; // Flag to indicate employee submission
}

const InstanceWorkReportSchema = new Schema<IInstanceWorkReport>({
  instance_id: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentInstance',
    required: true
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: false
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  work_date: {
    type: String,
    required: true
  },
  hours_spent: {
    type: Number,
    min: 0,
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(link: string) {
        if (!link || link.trim() === '') return true; // Optional field - allow empty/null
        const trimmedLink = link.trim();
        return /^https?:\/\//i.test(trimmedLink) && trimmedLink.length <= 2048;
      },
      message: 'Link must be a valid http/https URL (max 2048 characters).'
    }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'SUBMITTED'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  submitted_at: {
    type: Date,
    required: false
  },
  submitted_by_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  submitted_by_admin: {
    type: Boolean,
    default: false
  },
  submitted_by_employee: {
    type: Boolean,
    default: false
  }
});

// Pre-save middleware to update updated_at and auto-populate corporate_account_id
InstanceWorkReportSchema.pre('save', function(next) {
  // Auto-populate corporate_account_id from account_id if not set
  if (!this.corporate_account_id && this.account_id) {
    this.corporate_account_id = this.account_id;
  }
  
  this.updated_at = new Date();
  if (this.status === 'SUBMITTED' && !this.submitted_at) {
    this.submitted_at = new Date();
  }
  next();
});

// Indexes
InstanceWorkReportSchema.index({ instance_id: 1, account_id: 1 });
InstanceWorkReportSchema.index({ employee_id: 1 });
InstanceWorkReportSchema.index({ user_id: 1 });
InstanceWorkReportSchema.index({ status: 1 });
InstanceWorkReportSchema.index({ work_date: 1 });
InstanceWorkReportSchema.index({ created_at: -1 });
InstanceWorkReportSchema.index({ corporate_account_id: 1 }); // Index for corporate account filtering

const modelName = 'InstanceWorkReport';

// Check if model already exists to prevent re-compilation error
const InstanceWorkReport = mongoose.models[modelName] || 
  mongoose.model<IInstanceWorkReport>(modelName, InstanceWorkReportSchema);

export default InstanceWorkReport;
