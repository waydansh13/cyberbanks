const Log = require('../models/Log');
const Alert = require('../models/Alert');
const logger = require('./logger');

/**
 * Create an audit log entry in MongoDB + Winston
 */
const createLog = async ({
  action,
  userId = null,
  email = null,
  ipAddress = 'unknown',
  userAgent = null,
  details = {},
  severity = 'info',
  success = true,
}) => {
  try {
    const log = await Log.create({
      action,
      userId,
      email,
      ipAddress,
      userAgent,
      details,
      severity,
      success,
    });

    // Mirror to Winston
    const logMessage = `${action} | IP: ${ipAddress} | User: ${email || userId || 'anonymous'}`;
    if (severity === 'critical') {
      logger.threat(logMessage, details);
    } else if (severity === 'warning') {
      logger.security(logMessage, details);
    } else {
      logger.auth(logMessage, details);
    }

    return log;
  } catch (err) {
    logger.error(`Failed to create audit log: ${err.message}`);
    return null;
  }
};

/**
 * Create a security alert
 */
const createAlert = async ({
  type,
  severity,
  title,
  description,
  strideCategory,
  userId = null,
  email = null,
  ipAddress = null,
  metadata = {},
  relatedLogId = null,
}) => {
  try {
    const alert = await Alert.create({
      type,
      severity,
      title,
      description,
      strideCategory,
      userId,
      email,
      ipAddress,
      metadata,
      relatedLogId,
    });

    logger.threat(`ALERT CREATED: [${severity.toUpperCase()}] ${title}`, {
      type,
      strideCategory,
      ipAddress,
      email,
    });

    return alert;
  } catch (err) {
    logger.error(`Failed to create security alert: ${err.message}`);
    return null;
  }
};

/**
 * STRIDE Threat Detection Engine
 * Analyzes recent logs for patterns and triggers alerts
 */
const detectThreats = async ({ action, userId, email, ipAddress }) => {
  try {
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const since = new Date(Date.now() - windowMs);

    if (action === 'LOGIN_FAILED') {
      // Detect brute force by IP
      const failuresByIP = await Log.countDocuments({
        action: 'LOGIN_FAILED',
        ipAddress,
        createdAt: { $gte: since },
      });

      if (failuresByIP >= 10) {
        await createAlert({
          type: 'BRUTE_FORCE',
          severity: 'critical',
          title: 'Brute Force Attack Detected',
          description: `${failuresByIP} failed login attempts from IP ${ipAddress} in the last 15 minutes.`,
          strideCategory: 'Spoofing',
          userId,
          email,
          ipAddress,
          metadata: { failureCount: failuresByIP, windowMinutes: 15 },
        });
      } else if (failuresByIP >= 5) {
        await createAlert({
          type: 'MULTIPLE_FAILURES',
          severity: 'high',
          title: 'Multiple Login Failures',
          description: `${failuresByIP} failed login attempts from IP ${ipAddress}.`,
          strideCategory: 'Spoofing',
          userId,
          email,
          ipAddress,
          metadata: { failureCount: failuresByIP },
        });
      }

      // Detect brute force by email
      if (email) {
        const failuresByEmail = await Log.countDocuments({
          action: 'LOGIN_FAILED',
          email,
          createdAt: { $gte: since },
        });

        if (failuresByEmail >= 5) {
          await createAlert({
            type: 'ACCOUNT_LOCKOUT',
            severity: 'high',
            title: 'Account Under Attack',
            description: `Account ${email} has ${failuresByEmail} failed login attempts. Account locked.`,
            strideCategory: 'DoS',
            userId,
            email,
            ipAddress,
            metadata: { failureCount: failuresByEmail },
          });
        }
      }
    }

    if (action === 'UNAUTHORIZED_ACCESS') {
      await createAlert({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'high',
        title: 'Unauthorized Access Attempt',
        description: `User attempted to access a restricted resource from IP ${ipAddress}.`,
        strideCategory: 'Elevation of Privilege',
        userId,
        email,
        ipAddress,
      });
    }

    if (action === 'RATE_LIMIT_HIT') {
      await createAlert({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        title: 'Rate Limit Exceeded',
        description: `Too many requests from IP ${ipAddress}. Possible DoS attempt.`,
        strideCategory: 'DoS',
        ipAddress,
        metadata: { action },
      });
    }
  } catch (err) {
    logger.error(`Threat detection error: ${err.message}`);
  }
};

module.exports = { createLog, createAlert, detectThreats };
