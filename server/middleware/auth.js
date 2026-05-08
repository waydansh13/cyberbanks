const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLog } = require('../utils/auditLogger');
const logger = require('../utils/logger');

// STRIDE: Spoofing - Verify JWT token on every protected request
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    await createLog({
      action: 'UNAUTHORIZED_ACCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { path: req.path, method: req.method },
      severity: 'warning',
      success: false,
    });

    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user (catches revoked/deactivated accounts)
    const user = await User.findById(decoded.id).select('+loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // Password changed after token issued
    if (user.passwordChangedAt) {
      const tokenIssuedAt = decoded.iat * 1000;
      if (user.passwordChangedAt.getTime() > tokenIssuedAt) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    logger.security('Invalid JWT token attempt', { ip: req.ip, error: err.message });

    await createLog({
      action: 'UNAUTHORIZED_ACCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { error: 'Invalid token', path: req.path },
      severity: 'warning',
      success: false,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

// STRIDE: Elevation of Privilege - Role-based access control
const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      await createLog({
        action: 'UNAUTHORIZED_ACCESS',
        userId: req.user._id,
        email: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          requiredRoles: roles,
          userRole: req.user.role,
          path: req.path,
        },
        severity: 'critical',
        success: false,
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
