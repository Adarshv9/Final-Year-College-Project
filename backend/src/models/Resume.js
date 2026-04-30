// Defines the MongoDB schema for Resume data.

import mongoose from 'mongoose';


const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);


const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      trim: true
    },
    institution: {
      type: String,
      trim: true
    },
    year: {
      type: Number
    }
  },
  { _id: false }
);


const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);


const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    summary: {
      type: String,
      trim: true
    },
    skills: [
    {
      type: String,
      trim: true,
      lowercase: true
    }],

    experiences: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    experienceYears: {
      type: Number,
      default: 0,
      min: 0
    },
    fileUrl: {
      type: String,
      trim: true
    },
    filePublicId: {
      type: String,
      trim: true
    },
    rawText: {
      type: String,
      trim: true
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);


resumeSchema.index({ skills: 1 });
resumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Resume', resumeSchema);