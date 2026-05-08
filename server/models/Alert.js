const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'BRUTE_FORCE',
        'ACCOUNT_LOCKOUT',
        'SUSPICIOUS_IP',
        'MULTIPLE_FAILURES',
        'PRIVILEGE_ESCALATION',
        'UNAUTHORIZED_ENDPOINT',
        'RATE_LIMIT_EXCEEDED',
        'ANOMALOUS_BEHAVIOR',
        'SQL_INJECTION_ATTEMPT',
        'XSS_ATTEMPT',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // STRIDE category this alert relates to
    strideCategory: {
      type: String,
      enum: ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'DoS', 'Elevation of Privilege'],
      required: true,
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
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Log',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1, resolved: 1 });
alertSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
