import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeProfile extends Document {
  _id: mongoose.Types.ObjectId; // MongoDB's actual _id field
  employee_id: mongoose.Types.ObjectId; // This will be the same as _id
  user_id: mongoose.Types.ObjectId;
  corporate_account_id: mongoose.Types.ObjectId; // Reference to CorporateAccount
  first_name: string;
  last_name: string;
  phoneNumber?: string;
  department: string;
  job_title: string;
  custom_attributes?: { [key: string]: string }; // Flexible custom attributes storage
  employeeId: string; // Company's internal employee ID
  hireDate: Date;
  managerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  licenseId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  created_at: Date;
  updated_at: Date;
  dynamicCustomAttributes?: any[]; // Virtual field for EmployeeAttributeValue
  getCustomAttributesLegacyFormat(): Promise<{ [key: string]: string }>;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  corporate_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true
  },
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  job_title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  custom_attributes: {
    type: Map,
    of: String,
    default: new Map()
  },
  employeeId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  licenseId: {
    type: Schema.Types.ObjectId,
    ref: 'License'
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set employee_id to _id before saving
EmployeeProfileSchema.pre('save', function(next) {
  this.employee_id = this._id;
  next();
});

// Compound index for efficient queries
EmployeeProfileSchema.index({ user_id: 1, isActive: 1 });
EmployeeProfileSchema.index({ corporate_account_id: 1, isActive: 1 });
EmployeeProfileSchema.index({ department: 1 });
EmployeeProfileSchema.index({ employeeId: 1 });

// Virtual field to populate custom attributes from EmployeeAttributeValue model
EmployeeProfileSchema.virtual('dynamicCustomAttributes', {
  ref: 'EmployeeAttributeValue',
  localField: '_id',
  foreignField: 'employee_id'
});

// Method to get custom attributes in the legacy format for backward compatibility
EmployeeProfileSchema.methods.getCustomAttributesLegacyFormat = async function() {
  const EmployeeAttributeValue = mongoose.model('EmployeeAttributeValue');
  const CustomAttributeDefinition = mongoose.model('CustomAttributeDefinition');
  
  const attributeValues = await EmployeeAttributeValue.find({
    employee_id: this._id
  }).populate('attribute_id');

  const legacyFormat: { [key: string]: string } = {};
  
  attributeValues.forEach((attrValue: any) => {
    if (attrValue.attribute_id && attrValue.attribute_id.position) {
      legacyFormat[`position_${attrValue.attribute_id.position}`] = attrValue.value;
    }
  });

  return legacyFormat;
};

// Force model refresh to ensure new schema is used
const modelName = 'EmployeeProfile';
if (mongoose && mongoose.models && mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

const EmployeeProfile = mongoose.model<IEmployeeProfile>(modelName, EmployeeProfileSchema);

export default EmployeeProfile;
