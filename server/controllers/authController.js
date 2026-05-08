const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLog, detectThreats } = require('../utils/auditLogger');
const logger = require('../utils/logger');

// Helper: Generate JWT
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountNumber: user.accountNumber,
      lastLogin: user.lastLogin,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
    });

    await createLog({
      action: 'REGISTER',
      userId: user._id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { name, role: user.role },
      severity: 'info',
      success: true,
    });

    logger.auth('New user registered', { email, role: user.role, ip: req.ip });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      // STRIDE: Info Disclosure - Don't reveal if email exists
      await createLog({
        action: 'LOGIN_FAILED',
        email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'User not found' },
        severity: 'warning',
        success: false,
      });

      await detectThreats({ action: 'LOGIN_FAILED', email, ipAddress: req.ip });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // STRIDE: DoS - Check if account is locked
    if (user.isLocked()) {
      const unlockTime = new Date(user.lockUntil);
      await createLog({
        action: 'LOGIN_FAILED',
        userId: user._id,
        email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'Account locked', lockUntil: unlockTime },
        severity: 'warning',
        success: false,
      });

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Try again after ${unlockTime.toLocaleTimeString()}.`,
        lockUntil: unlockTime,
      });
    }

    // STRIDE: Spoofing - Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      await user.incrementLoginAttempts();

      const remainingAttempts =
        (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5) - user.loginAttempts;

      await createLog({
        action: 'LOGIN_FAILED',
        userId: user._id,
        email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          reason: 'Invalid password',
          loginAttempts: user.loginAttempts,
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        severity: 'warning',
        success: false,
      });

      await detectThreats({
        action: 'LOGIN_FAILED',
        userId: user._id,
        email,
        ipAddress: req.ip,
      });

      // Account just got locked
      if (user.isLocked()) {
        await createLog({
          action: 'ACCOUNT_LOCKED',
          userId: user._id,
          email,
          ipAddress: req.ip,
          details: { lockUntil: user.lockUntil },
          severity: 'critical',
          success: false,
        });

        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${Math.max(0, remainingAttempts)} attempt(s) remaining.`,
      });
    }

    // Successful login
    await user.resetLoginAttempts();
    user.lastLoginIP = req.ip;
    await user.save({ validateBeforeSave: false });

    await createLog({
      action: 'LOGIN_SUCCESS',
      userId: user._id,
      email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { role: user.role },
      severity: 'info',
      success: true,
    });

    logger.auth('Successful login', { email, role: user.role, ip: req.ip });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (client-side token removal; log the action)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    await createLog({
      action: 'LOGOUT',
      userId: req.user._id,
      email: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'info',
      success: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    await createLog({
      action: 'DATA_ACCESS',
      userId: req.user._id,
      email: req.user.email,
      ipAddress: req.ip,
      details: { resource: 'own_profile' },
      severity: 'info',
      success: true,
    });

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};
