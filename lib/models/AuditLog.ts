import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId; // MongoDB's actual _id field
  log_id: mongoose.Types.ObjectId; // This will be the same as _id
  performed_by_user_id: mongoose.Types.ObjectId;
  target_user_id?: mongoose.Types.ObjectId;
  action_type: string;
  details: string;
  timestamp: Date;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  performed_by_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  action_type: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'ADMIN_LOGIN',
      'USER_LOGIN',
      'EMPLOYEE_LOGIN',
      'ADMIN_LOGIN_AS_EMPLOYEE',
      'ADMIN_LOGOUT_FROM_EMPLOYEE',
      'LOGOUT',
      'ADMIN_LOGOUT',
      'USER_LOGOUT',
      'EMPLOYEE_LOGOUT',
      'ADD_EMPLOYEE',
      'EDIT_EMPLOYEE',
      'DEACTIVATE_EMPLOYEE',
      'DELETE_EMPLOYEE',
      'BULK_UPLOAD',
      'ASSIGN_LICENSE',
      'REVOKE_LICENSE',
      'UPDATE_CUSTOM_ATTRIBUTES',
      'VIEW_REPORT',
      'EXPORT_REPORT',
      'CREATE_CORPORATE_ACCOUNT',
      'UPDATE_CORPORATE_ACCOUNT',
      'PASSWORD_RESET',
      'ACCOUNT_SUSPENSION'
    ]
  },
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Set log_id to _id before saving
AuditLogSchema.pre('save', function(next) {
  this.log_id = this._id;
  next();
});

// Indexes for efficient queries and compliance
AuditLogSchema.index({ performed_by_user_id: 1, timestamp: -1 });
AuditLogSchema.index({ target_user_id: 1, timestamp: -1 });
AuditLogSchema.index({ action_type: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// Force model refresh to ensure new schema is used
const modelName = 'AuditLog';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<IAuditLog>(modelName, AuditLogSchema);
