const mongoose = require('mongoose');
const Job = require('../models/Job');
const Task = require('../models/Task');
const { MESSAGES } = require('../constants/messages');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Get comprehensive dashboard analytics
 * Bundles multiple database queries for optimal performance
 */
const getDashboard = catchAsync(async (req, res) => {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.user.id);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
        totalApplications,
        statusBreakdown,
        thisMonthApplications,
        recentApplications,
        upcomingTasks
    ] = await Promise.all([
        // Total applications count
        Job.countDocuments({ userId }),
        
        Job.aggregate([
            { $match: { userId } },
            { $group: { _id: '$status', count: { $sum:1 } } },
            { $sort: { count: -1 } } 
        ]),
        
        // This month's applications
        Job.countDocuments({ 
            userId, 
            dateApplied: { $gte: startOfMonth } 
        }),
        
        // Recently added applications (last 7 days)
        Job.find({ 
            userId, 
            createdAt: { $gte: sevenDaysAgo } 
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('company position status dateApplied createdAt'),
        
        // Upcoming tasks (next 7 days)
        Task.find({ 
            userId, 
            dueDateTime: { $gte: now, $lte: sevenDaysFromNow },
            completed: false
        })
        .sort({ dueDateTime: 1 })
        .limit(10)
        .select('title dueDateTime taskType completed')
    ]);

    const byStatus = {
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0
    };
    
    statusBreakdown.forEach(item => {
        if (item._id in byStatus) {
            byStatus[item._id] = item.count;
        }
    });

    res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.ANALYTICS_RETRIEVED,
        data: {
            totalApplications,
            byStatus,
            thisMonthApplications,
            recentApplications,
            upcomingTasks
        }
    });
});

/**
 * Get timeline analytics for trends over time
 */
const getTimeline = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { period = 'daily' } = req.query;
    
    let groupBy;
    const now = new Date();
    let startDate;

    // Set date range and grouping based on period
    switch (period) {
        case 'daily':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
            groupBy = {
                year: { $year: '$dateApplied' },
                month: { $month: '$dateApplied' },
                day: { $dayOfMonth: '$dateApplied' }
            };
            break;
        case 'monthly':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
            groupBy = {
                year: { $year: '$dateApplied' },
                month: { $month: '$dateApplied' }
            };
            break;
        default: // weekly
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months
            groupBy = {
                year: { $year: '$dateApplied' },
                week: { $week: '$dateApplied' }
            };
    }

    const timelineData = await Job.aggregate([
        {
            $match: {
                userId,
                dateApplied: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: groupBy,
                applications: { $sum: 1 },
                interviews: {
                    $sum: { $cond: [{ $eq: ['$status', 'interviewing'] }, 1, 0] }
                },
                offers: {
                    $sum: { $cond: [{ $eq: ['$status', 'offer'] }, 1, 0] }
                },
                rejections: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 }
        }
    ]);

    const formatPeriod = (item, periodType) => {
        if (periodType === 'daily') {
            return `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
        }
        if (periodType === 'monthly') {
            return `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        }
        // weekly (default)
        return `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
    };

    res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.ANALYTICS_RETRIEVED,
        data: {
            period,
            timeline: timelineData.map(item => ({
                period: formatPeriod(item, period),
                applications: item.applications,
                interviews: item.interviews,
                offers: item.offers,
                rejections: item.rejections
            }))
        }
    });
});

/**
 * Get advanced insights and patterns
 */
const getInsights = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute multiple analytics queries in parallel
    const [
        stageProgression,
        dayOfWeekSuccess,
        applicationVelocity
    ] = await Promise.all([
        // Average time between application stages
        Job.aggregate([
            { $match: { userId } },
            { $sort: { dateApplied: 1 } },
            {
                $group: {
                    _id: null,
                    avgTimeToInterview: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'interviewing'] },
                                { $subtract: ['$updatedAt', '$dateApplied'] },
                                null
                            ]
                        }
                    },
                    avgTimeToOffer: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'offer'] },
                                { $subtract: ['$updatedAt', '$dateApplied'] },
                                null
                            ]
                        }
                    }
                }
            }
        ]),

        // Success rate by day of week
        Job.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: { $dayOfWeek: '$dateApplied' },
                    total: { $sum: 1 },
                    offers: { $sum: { $cond: [{ $eq: ['$status', 'offer'] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    successRate: { $multiply: [{ $divide: ['$offers', '$total'] }, 100] },
                    dayName: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 1] }, then: 'Sunday' },
                                { case: { $eq: ['$_id', 2] }, then: 'Monday' },
                                { case: { $eq: ['$_id', 3] }, then: 'Tuesday' },
                                { case: { $eq: ['$_id', 4] }, then: 'Wednesday' },
                                { case: { $eq: ['$_id', 5] }, then: 'Thursday' },
                                { case: { $eq: ['$_id', 6] }, then: 'Friday' },
                                { case: { $eq: ['$_id', 7] }, then: 'Saturday' }
                            ]
                        }
                    }
                }
            },
            { $sort: { successRate: -1 } }
        ]),

        // Application velocity (applications per week)
        Job.aggregate([
            { 
                $match: { 
                    userId,
                    dateApplied: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$dateApplied' },
                        week: { $week: '$dateApplied' }
                    },
                    applications: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.week': 1 } }
        ])
    ]);

    // Process stage progression data
    const stageData = stageProgression[0] || {};
    const avgTimeToInterview = stageData.avgTimeToInterview 
        ? Math.round(stageData.avgTimeToInterview / (1000 * 60 * 60 * 24)) // Convert to days
        : 0;
    const avgTimeToOffer = stageData.avgTimeToOffer 
        ? Math.round(stageData.avgTimeToOffer / (1000 * 60 * 60 * 24)) // Convert to days
        : 0;

    // Calculate average applications per week
    const totalWeeks = applicationVelocity.length;
    const totalApplications = applicationVelocity.reduce((sum, week) => sum + week.applications, 0);
    const avgApplicationsPerWeek = totalWeeks > 0 ? (totalApplications / totalWeeks).toFixed(1) : 0;

    res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.ANALYTICS_RETRIEVED,
        data: {
            stageProgression: {
                avgTimeToInterview,
                avgTimeToOffer
            },
            dayOfWeekSuccess: dayOfWeekSuccess.map(item => ({
                day: item.dayName,
                successRate: parseFloat(item.successRate.toFixed(1)),
                totalApplications: item.total
            })),
            applicationVelocity: {
                avgApplicationsPerWeek: parseFloat(avgApplicationsPerWeek),
                weeklyBreakdown: applicationVelocity.map(week => ({
                    week: `${week._id.year}-W${String(week._id.week).padStart(2, '0')}`,
                    applications: week.applications
                }))
            }
        }
    });
});

module.exports = {
    getDashboard,
    getTimeline,
    getInsights
};