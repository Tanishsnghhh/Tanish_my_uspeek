import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoUploadActivity extends Document {
  video_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  employee_id: mongoose.Types.ObjectId;
  assignment_employee_id?: mongoose.Types.ObjectId;
  upload_date: Date;
  video_url: string;
  created_at: Date;
}

const VideoUploadActivitySchema = new Schema({
  video_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'CorporateAccount',
    required: true,
    index: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
    index: true
  },
  assignment_employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentEmployee',
    default: null
  },
  upload_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  video_url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(value: string) {
        return /^https?:\/\/.+/.test(value);
      },
      message: 'Video URL must be a valid HTTP/HTTPS URL'
    }
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: false 
  }
});

// Set video_id to _id before saving
VideoUploadActivitySchema.pre('save', function(next) {
  this.video_id = this._id;
  next();
});

// Indexes for efficient queries
VideoUploadActivitySchema.index({ employee_id: 1, upload_date: -1 });
VideoUploadActivitySchema.index({ account_id: 1, upload_date: -1 });
VideoUploadActivitySchema.index({ assignment_employee_id: 1 });
VideoUploadActivitySchema.index({ account_id: 1, employee_id: 1, upload_date: -1 });

// Force model refresh to ensure new schema is used
const modelName = 'VideoUploadActivity';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export default mongoose.model<IVideoUploadActivity>(modelName, VideoUploadActivitySchema);
