// ── Recruiter Profile Model ──
import mongoose from 'mongoose';

// Recruiter profile with company information
const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    companySize: {
      type: String,
      trim: true,
    },
    companyDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const RecruiterProfile = mongoose.model('RecruiterProfile', recruiterProfileSchema);

export default RecruiterProfile;
