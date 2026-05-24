import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  instance_id: mongoose.Types.ObjectId;
  employee_id: mongoose.Types.ObjectId;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  assigned_at: Date;
  started_at?: Date;
  completed_at?: Date;
  progress_percentage?: number; // 0-100
  score?: number; // Optional score for completed assignments
  feedback?: string;
  submission_data?: any; // Flexible field for assignment-specific data
  created_at: Date;
  updated_at: Date;
}

const AssignmentEmployeeSchema = new Schema<IAssignmentEmployee>({
  instance_id: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentInstance',
    required: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  assigned_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  progress_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  submission_data: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set assigned_at to current time when status changes to ASSIGNED
AssignmentEmployeeSchema.pre('save', async function(next) {
  // Auto-populate corporate_account_id from employee if not set
  if (!this.corporate_account_id && this.employee_id) {
    try {
      const EmployeeProfile = mongoose.model('EmployeeProfile');
      const employee = await EmployeeProfile.findById(this.employee_id);
      if (employee && employee.corporate_account_id) {
        this.corporate_account_id = employee.corporate_account_id;
      }
    } catch (error) {
      console.error('Error auto-populating corporate_account_id:', error);
    }
  }

  if (this.isModified('status') && this.status === 'ASSIGNED' && !this.assigned_at) {
    this.assigned_at = new Date();
  }
  
  // Set started_at when status changes to IN_PROGRESS
  if (this.isModified('status') && this.status === 'IN_PROGRESS' && !this.started_at) {
    this.started_at = new Date();
  }
  
  // Set completed_at when status changes to COMPLETED
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.completed_at) {
    this.completed_at = new Date();
  }
  
  next();
});

// Indexes for efficient queries
AssignmentEmployeeSchema.index({ instance_id: 1, employee_id: 1 }, { unique: true });
AssignmentEmployeeSchema.index({ corporate_account_id: 1 });
AssignmentEmployeeSchema.index({ employee_id: 1, status: 1 });
AssignmentEmployeeSchema.index({ instance_id: 1, status: 1 });
AssignmentEmployeeSchema.index({ status: 1, assigned_at: 1 });
AssignmentEmployeeSchema.index({ completed_at: 1 });

// Force model refresh to ensure new schema is used
const modelName = 'AssignmentEmployee';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose && mongoose.model ? mongoose.model<IAssignmentEmployee>(modelName, AssignmentEmployeeSchema) : null;
