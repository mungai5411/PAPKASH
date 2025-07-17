const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referrals', 'name email createdAt')
      .populate('completedTasks.taskId', 'title category reward');

    // Get task statistics
    const totalTasks = await Task.countDocuments({ isActive: true });
    const completedTasks = user.completedTasks.length;
    const pendingTasks = user.completedTasks.filter(ct => ct.status === 'pending').length;
    const approvedTasks = user.completedTasks.filter(ct => ct.status === 'approved').length;

    // Get earnings breakdown
    const earningsBreakdown = {
      total: user.earnings.total,
      available: user.earnings.available,
      pending: user.earnings.pending,
      fromTasks: user.completedTasks
        .filter(ct => ct.status === 'approved')
        .reduce((sum, ct) => sum + ct.earnings, 0),
      fromReferrals: user.referrals.length * 50 // Ksh 50 per referral
    };

    // Get recent activity
    const recentTasks = user.completedTasks
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5)
      .map(ct => ({
        task: ct.taskId,
        completedAt: ct.completedAt,
        earnings: ct.earnings,
        status: ct.status
      }));

    // Get payment history
    const payments = await Payment.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const dashboardData = {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        isActive: user.isActive,
        paymentStatus: user.paymentStatus,
        joinedAt: user.createdAt
      },
      statistics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        approvedTasks,
        totalReferrals: user.referrals.length
      },
      earnings: earningsBreakdown,
      recentActivity: recentTasks,
      referrals: user.referrals,
      payments
    };

    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get earnings summary
router.get('/earnings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedTasks.taskId', 'title category reward');

    // Calculate earnings by category
    const earningsByCategory = {};
    user.completedTasks.forEach(ct => {
      if (ct.status === 'approved' && ct.taskId) {
        const category = ct.taskId.category;
        earningsByCategory[category] = (earningsByCategory[category] || 0) + ct.earnings;
      }
    });

    // Calculate daily earnings for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyEarnings = {};
    user.completedTasks.forEach(ct => {
      if (ct.status === 'approved' && ct.completedAt >= thirtyDaysAgo) {
        const date = ct.completedAt.toISOString().split('T')[0];
        dailyEarnings[date] = (dailyEarnings[date] || 0) + ct.earnings;
      }
    });

    res.json({
      earnings: {
        total: user.earnings.total,
        available: user.earnings.available,
        pending: user.earnings.pending,
        byCategory: earningsByCategory,
        daily: dailyEarnings
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get referral statistics
router.get('/referrals', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referrals', 'name email createdAt paymentStatus isActive');

    const referralStats = {
      totalReferrals: user.referrals.length,
      activeReferrals: user.referrals.filter(r => r.isActive).length,
      pendingReferrals: user.referrals.filter(r => r.paymentStatus === 'pending').length,
      totalEarnings: user.referrals.length * 50, // Ksh 50 per referral
      referrals: user.referrals.map(r => ({
        name: r.name,
        email: r.email,
        joinedAt: r.createdAt,
        status: r.paymentStatus,
        isActive: r.isActive
      }))
    };

    res.json({ referralStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;