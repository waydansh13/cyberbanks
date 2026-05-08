const Log = require('../models/Log');
const Alert = require('../models/Alert');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all security logs (paginated)
// @route   GET /api/logs
// @access  Private (admin, analyst)
exports.getLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by action
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter by severity
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }

    // Filter by IP
    if (req.query.ip) {
      filter.ipAddress = req.query.ip;
    }

    // Date range
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role'),
      Log.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all alerts (paginated, filterable)
// @route   GET /api/logs/alerts
// @access  Private (admin, analyst)
exports.getAlerts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.resolved !== undefined) {
      filter.resolved = req.query.resolved === 'true';
    }

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      Alert.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/logs/stats
// @access  Private (admin, analyst)
exports.getStats = async (req, res, next) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalLogs,
      totalAlerts,
      unresolvedAlerts,
      failedLogins24h,
      successLogins24h,
      criticalAlerts,
      recentLogs,
      alertsBySeverity,
      loginsByDay,
    ] = await Promise.all([
      User.countDocuments(),
      Log.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ resolved: false }),
      Log.countDocuments({ action: 'LOGIN_FAILED', createdAt: { $gte: last24h } }),
      Log.countDocuments({ action: 'LOGIN_SUCCESS', createdAt: { $gte: last24h } }),
      Alert.countDocuments({ severity: 'critical', resolved: false }),
      Log.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Log.aggregate([
        {
          $match: {
            action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
            createdAt: { $gte: last7d },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              action: '$action',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalLogs,
          totalAlerts,
          unresolvedAlerts,
          criticalAlerts,
        },
        last24h: {
          failedLogins: failedLogins24h,
          successfulLogins: successLogins24h,
          loginSuccessRate:
            successLogins24h + failedLogins24h > 0
              ? Math.round((successLogins24h / (successLogins24h + failedLogins24h)) * 100)
              : 100,
        },
        charts: {
          alertsBySeverity,
          loginsByDay,
        },
        recentActivity: recentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve an alert
// @route   PATCH /api/logs/alerts/:id/resolve
// @access  Private (admin)
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    logger.info(`Alert resolved: ${alert.type} by ${req.user.email}`);

    res.status(200).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};
