// Defines the MongoDB schema for User data.

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    _id: false
  }
);


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number must be at most 30 characters'],
      default: ''
    },
    location: {
      type: String,
      trim: true,
      maxlength: [80, 'Location must be at most 80 characters'],
      default: ''
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },
    role: {
      type: String,
      enum: {
        values: ['job_seeker', 'recruiter', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'job_seeker'
    },
    pendingRole: {


      type: String,
      enum: {
        values: ['recruiter'],
        message: '{VALUE} is not a valid pending role'
      },
      default: null
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid approval status'
      },
      default: null
    },
    otp: {
      type: String,
      select: false
    },
    otpExpiresAt: {
      type: Date,
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1 });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;