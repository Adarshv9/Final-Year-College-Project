import mongoose from 'mongoose';

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
      set: (skills) =>
        Array.isArray(skills)
          ? skills
              .filter(Boolean)
              .map((skill) => (typeof skill === 'string' ? skill.trim() : skill))
          : [],
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

const JobSeekerProfile = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);

export default JobSeekerProfile;
