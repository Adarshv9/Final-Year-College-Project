import mongoose from 'mongoose';
import normalizeSkills from '../utils/normalizeSkills.js';

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      required: [true, 'Location type is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: locationSchema,
      required: [true, 'Location is required'],
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
    minExperience: {
      type: Number,
      required: [true, 'Minimum experience is required'],
      min: 0,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract'],
      required: [true, 'Job type is required'],
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

jobSchema.index({ recruiterId: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
