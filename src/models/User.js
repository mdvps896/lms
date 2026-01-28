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
  username: {
    type: String,
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: function () {
      return this.authProvider === 'local';
    }
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
    enum: ['local', 'google', 'mobile'],
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
  // Registration OTP (for email verification during signup)
  registrationOtp: {
    type: String,
    default: null,
  },
  registrationOtpExpiry: {
    type: Date,
    default: null,
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
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'Lecture' 
    }]
  }],
  fcmToken: {
    type: String,
    default: null,
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  // Address fields
  address: String,
  city: String,
  state: String,
  pincode: String,
  // Security fields for account locking
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  // Single device login tracking
  activeDeviceId: {
    type: String,
    default: null
  },
  // Security: Track device switching frequency
  deviceChangeCount: {
    type: Number,
    default: 0
  },
  deviceChangeWindowStart: {
    type: Date,
    default: null
  },
  registerSource: {
    type: String,
    enum: ['web', 'app'],
    default: 'web',
  },
  lastActiveAt: {
    type: Date,
    default: null
  },
  dob: {
    type: Date,
    default: null
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other',
  },
  secondaryEmail: String,
  education: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Support blocking
  isSupportBlocked: {
    type: Boolean,
    default: false
  },
  // E-Sign Images (Fallback/Storage)
  esign_images: {
    passportFront: { type: String, default: null },
    passportBack: { type: String, default: null },
    passportPhoto: { type: String, default: null },
    selfiePhoto: { type: String, default: null },
    signatureImage: { type: String, default: null }
  },
}, {
  timestamps: true,
  strict: false  // Allow additional fields
});

// Cascade delete support messages when user is deleted
userSchema.pre('findOneAndDelete', async function () {
  try {
    const userId = this.getQuery()._id;
    if (userId) {
      // Delete all support messages for this user
      try {
        const SupportMessage = mongoose.models.SupportMessage;
        if (SupportMessage) {
          await SupportMessage.deleteMany({ user: userId });
        }
      } catch (modelError) {
      }
    }
  } catch (error) {
    console.error('Error in cascade delete:', error);
  }
});

userSchema.pre('deleteOne', async function () {
  try {
    const userId = this.getQuery()._id;
    if (userId) {
      // Delete all support messages for this user
      try {
        const SupportMessage = mongoose.models.SupportMessage;
        if (SupportMessage) {
          await SupportMessage.deleteMany({ user: userId });
        }
      } catch (modelError) {
      }
    }
  } catch (error) {
    console.error('Error in cascade delete:', error);
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
