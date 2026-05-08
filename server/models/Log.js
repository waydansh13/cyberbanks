const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    // STRIDE: Repudiation - Full audit trail
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'REGISTER',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',
        'ACCOUNT_LOCKED',
        'ACCOUNT_UNLOCKED',
        'UNAUTHORIZED_ACCESS',
        'TOKEN_REFRESH',
        'SUSPICIOUS_ACTIVITY',
        'RATE_LIMIT_HIT',
        'ADMIN_ACTION',
        'DATA_ACCESS',
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    success: {
      type: Boolean,
      default: true,
    },
    // Geolocation placeholder
    location: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries on time-based lookups
logSchema.index({ createdAt: -1 });
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
