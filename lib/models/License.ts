import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  _id: mongoose.Types.ObjectId; // MongoDB's actual _id field
  license_id: mongoose.Types.ObjectId; // This will be the same as _id
  license_type: 'USPEAK_PRO' | 'USPEAK_BASIC' | 'USPEAK_ENTERPRISE';
  status: 'ASSIGNED' | 'AVAILABLE' | 'EXPIRED' | 'REVOKED';
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  assigned_to_employee_id?: mongoose.Types.ObjectId;
  assigned_at?: Date;
  expires_at?: Date;
  license_key: string;
  features: string[];
  maxUsers?: number;
  created_at: Date;
  updated_at: Date;
}

const LicenseSchema = new Schema<ILicense>({
  license_type: {
    type: String,
    required: true,
    enum: ['USPEAK_PRO', 'USPEAK_BASIC', 'USPEAK_ENTERPRISE'],
    default: 'USPEAK_PRO'
  },
  status: {
    type: String,
    required: true,
    enum: ['ASSIGNED', 'AVAILABLE', 'EXPIRED', 'REVOKED'],
    default: 'AVAILABLE'
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  assigned_to_employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile'
  },
  assigned_at: {
    type: Date
  },
  expires_at: {
    type: Date
  },
  license_key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  features: [{
    type: String,
    enum: [
      'VIDEO_ANALYSIS',
      'LEARNING_LESSONS',
      'PROGRESS_TRACKING',
      'ADVANCED_REPORTING',
      'BULK_UPLOAD',
      'CUSTOM_ATTRIBUTES',
      'API_ACCESS'
    ]
  }],
  maxUsers: {
    type: Number,
    min: 1,
    default: 1
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set license_id to _id before saving
LicenseSchema.pre('save', function(next) {
  this.license_id = this._id;
  next();
});

// Generate license key before saving
LicenseSchema.pre('save', function(next) {
  if (!this.license_key) {
    this.license_key = 'USP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

// Indexes for efficient queries - only define once
LicenseSchema.index({ status: 1 });
LicenseSchema.index({ corporate_account_id: 1 });
LicenseSchema.index({ assigned_to_employee_id: 1 });
LicenseSchema.index({ expires_at: 1 });

// Force model refresh to ensure new schema is used
const modelName = 'License';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<ILicense>(modelName, LicenseSchema);
