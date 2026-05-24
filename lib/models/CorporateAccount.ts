import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICorporateAccount extends Document {
  _id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: 'ADMIN';
  status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED';
  companyName: string;
  subscriptionPlan: string;
  maxEmployees: number;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  phoneCode: string;
  location: string;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const CorporateAccountSchema = new Schema<ICorporateAccount>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    required: true,
    enum: ['ADMIN'],
    default: 'ADMIN'
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'DEACTIVATED', 'DELETED'],
    default: 'ACTIVE'
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  subscriptionPlan: {
    type: String,
    required: true,
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  },
  maxEmployees: {
    type: Number,
    required: true,
    min: 1,
    max: 50000,
    default: 100
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  countryCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10
  },
  phoneCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastLoginAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Set account_id to _id before saving
CorporateAccountSchema.pre('save', function(next) {
  this.account_id = this._id;
  next();
});

// Hash password before saving
CorporateAccountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
CorporateAccountSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for efficient queries
// Note: email and companyName indexes are automatically created by unique: true in schema
CorporateAccountSchema.index({ role: 1 });
CorporateAccountSchema.index({ status: 1 });
CorporateAccountSchema.index({ subscriptionPlan: 1 });

// Force model refresh to ensure new schema is used
const modelName = 'CorporateAccount';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

const CorporateAccount = mongoose.model<ICorporateAccount>(modelName, CorporateAccountSchema);

export default CorporateAccount;
