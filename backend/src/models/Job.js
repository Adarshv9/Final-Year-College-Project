// ── Job Model ──
import mongoose from 'mongoose';
import normalizeSkills from '../utils/normalizeSkills.js';

// Sub-schema for salary range
const salaryRangeSchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      min: 0,
    },
    max: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return this.min === undefined || value === undefined || value >= this.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary',
      },
    },
  },
  {
    _id: false,
  }
);

// Job listing schema with recruiter info and applicants tracking
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    experienceRequired: {
      type: Number,
      required: [true, 'Experience required is required'],
      min: 0,
    },
    salaryRange: {
      type: salaryRangeSchema,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
