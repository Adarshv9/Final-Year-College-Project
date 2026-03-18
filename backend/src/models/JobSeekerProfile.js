// ── Job Seeker Profile Model ──
import mongoose from 'mongoose';
import normalizeSkills from '../utils/normalizeSkills.js';

// Sub-schema for work experience
const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    years: {
      type: Number,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// Sub-schema for education details
const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1900,
    },
  },
  {
    _id: false,
  }
);

// Job seeker profile with skills, experience, education, and resume
const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient skill-based searching
jobSeekerProfileSchema.index({ skills: 1 });

const JobSeekerProfile = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);

export default JobSeekerProfile;
