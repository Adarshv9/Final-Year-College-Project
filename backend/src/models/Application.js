import mongoose from 'mongoose';

const educationSnapshotSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      trim: true,
      default: '',
    },
    institution: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const resumeSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    education: {
      type: educationSnapshotSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
      immutable: true,
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      immutable: true,
    },
    resumeSnapshot: {
      type: resumeSnapshotSchema,
      required: true,
      immutable: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    aiScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    aiReason: {
      type: String,
      trim: true,
      default: null,
    },
    hybridScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
