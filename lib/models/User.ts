import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; // MongoDB's actual _id field
  user_id: mongoose.Types.ObjectId; // This will be the same as _id
  account_id: mongoose.Types.ObjectId; // Foreign key to Admin (Corporate Account)
  email: string;
  password_hash: string;
  role: 'CORPORATE_ADMIN' | 'CORPORATE_USER' | 'EMPLOYEE' | 'B2C_CUSTOMER';
  status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED';
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  phoneCode?: string;
  location?: string;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChanged?: boolean; // Track if user has changed their temporary password
  tempPassword?: string; // Store temporary password for display purposes
  settings?: {
    notifications?: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      assignmentNotifications: boolean;
      reportNotifications: boolean;
      marketingEmails: boolean;
    };
    security?: {
      twoFactorEnabled: boolean;
      sessionTimeout: number;
      loginAlerts: boolean;
    };
    profile?: {
      location: string;
      bio: string;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password_hash: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    required: true,
    enum: ['CORPORATE_ADMIN', 'CORPORATE_USER', 'EMPLOYEE', 'B2C_CUSTOMER'],
    default: 'EMPLOYEE'
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'DEACTIVATED', 'DELETED'],
    default: 'ACTIVE'
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    trim: true
  },
  phoneCode: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  lastLoginAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  passwordChanged: {
    type: Boolean,
    default: false
  },
  tempPassword: {
    type: String
  },
  settings: {
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      assignmentNotifications: { type: Boolean, default: true },
      reportNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      sessionTimeout: { type: Number, default: 60 },
      loginAlerts: { type: Boolean, default: true }
    },
    profile: {
      location: { type: String, default: '' },
      bio: { type: String, default: '' }
    }
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set user_id to _id before saving
UserSchema.pre('save', function(next) {
  this.user_id = this._id;
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password_hash || !candidatePassword) {
    return false;
  }
  
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Indexes for efficient queries - only define once
UserSchema.index({ account_id: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

// Force model refresh to ensure new schema is used
const modelName = 'User';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

const User = mongoose.model<IUser>(modelName, UserSchema);

export default User;
