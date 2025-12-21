import mongoose from 'mongoose';
// Import Category to ensure it's registered before User model references it
import Category from './Category.js';

delete mongoose.models.User;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  username: {
    type: String,
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  isGoogleAuth: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    default: null,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  resetOtp: {
    type: String,
    default: null,
  },
  resetOtpExpiry: {
    type: Date,
    default: null,
  },
  // Two-Factor Authentication fields
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorOtp: {
    type: String,
    default: null,
  },
  twoFactorOtpExpiry: {
    type: Date,
    default: null,
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  strict: false  // Allow additional fields
});

export default mongoose.models.User || mongoose.model('User', userSchema);
