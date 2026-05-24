import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISuperAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  admin_id: mongoose.Types.ObjectId;
  fullName: string;
  emailId: string;
  userType: string;
  openPass: string; // This will store the plain text password for display purposes
  password_hash: string; // This will store the hashed password for authentication
  contactNo?: string;
  pictureLocation?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  administrator: boolean;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  created_at: Date;
  updated_at: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  userType: {
    type: String,
    required: true,
    enum: ['Super Administrator', 'Administrator', 'System Administrator', 'Support Administrator', 'Content Administrator', 'User Administrator', 'Data Administrator', 'Security Administrator', 'Network Administrator', 'Database Administrator'],
    default: 'Administrator'
  },
  openPass: {
    type: String,
    required: true,
    minlength: 6
  },
  password_hash: {
    type: String,
    required: true,
    minlength: 8
  },
  contactNo: {
    type: String,
    trim: true,
    maxlength: 20
  },
  pictureLocation: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  administrator: {
    type: Boolean,
    required: true,
    default: true
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
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set admin_id to _id before saving
SuperAdminSchema.pre('save', function(next) {
  this.admin_id = this._id;
  next();
});

// Hash password before saving
SuperAdminSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or is new)
  if (!this.isModified('password_hash')) return next();

  try {
    // Hash the openPass and store it in password_hash
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.openPass, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
SuperAdminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to get public profile (without sensitive data)
SuperAdminSchema.methods.getPublicProfile = function() {
  const adminObject = this.toObject();
  delete adminObject.password_hash;
  delete adminObject.passwordResetToken;
  delete adminObject.passwordResetExpires;
  return adminObject;
};

// Indexes for efficient queries
SuperAdminSchema.index({ emailId: 1 });
SuperAdminSchema.index({ status: 1 });
SuperAdminSchema.index({ userType: 1 });
SuperAdminSchema.index({ created_at: -1 });

export default mongoose.models.SuperAdmin || mongoose.model<ISuperAdmin>('SuperAdmin', SuperAdminSchema);
