import mongoose, { Schema, Document } from 'mongoose';

export interface IB2CCustomer extends Document {
  _id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  phoneCode: string;
  location: string;
  branch?: string;
  department?: string;
  role: string;
  employeeCode?: string;
  companyName?: string;
  gst?: string;
  gstNumber?: string;
  website?: string;
  designation?: string;
  description?: string;
  planId?: string;
  registrationDate: Date;
  planStartDate?: Date;
  planExpiryDate?: Date;
  videoLimit?: number;
  manager?: string;
  alternateEmail?: string;
  isAccountActive: boolean;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const B2CCustomerSchema = new Schema<IB2CCustomer>({
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
  userName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  address: {
    type: String,
    trim: true,
    maxlength: 200
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
  branch: {
    type: String,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'B2C_CUSTOMER'
  },
  employeeCode: {
    type: String,
    trim: true,
    maxlength: 50
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  gst: {
    type: String,
    trim: true,
    maxlength: 50
  },
  gstNumber: {
    type: String,
    trim: true,
    maxlength: 50
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200
  },
  designation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  planId: {
    type: String,
    trim: true,
    maxlength: 50
  },
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  planStartDate: {
    type: Date
  },
  planExpiryDate: {
    type: Date
  },
  videoLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  manager: {
    type: String,
    trim: true,
    maxlength: 100
  },
  alternateEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isAccountActive: {
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
  timestamps: true
});

// Set customer_id to _id before saving
B2CCustomerSchema.pre('save', function(next) {
  this.customer_id = this._id;
  next();
});

// Hash password before saving
B2CCustomerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
B2CCustomerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for efficient queries
B2CCustomerSchema.index({ email: 1 });
B2CCustomerSchema.index({ userName: 1 });
B2CCustomerSchema.index({ role: 1 });
B2CCustomerSchema.index({ isAccountActive: 1 });
B2CCustomerSchema.index({ registrationDate: 1 });

// Force model refresh to ensure new schema is used
const modelName = 'B2CCustomer';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

const B2CCustomer = mongoose.model<IB2CCustomer>(modelName, B2CCustomerSchema);

export default B2CCustomer;
