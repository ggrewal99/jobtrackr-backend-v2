const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getDashboard,
    getTimeline,
    getInsights
} = require('../controllers/analyticsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardAnalytics:
 *       type: object
 *       properties:
 *         totalApplications:
 *           type: number
 *           description: Total number of job applications
 *           example: 47
 *         byStatus:
 *           type: object
 *           properties:
 *             applied:
 *               type: number
 *               example: 15
 *             interviewing:
 *               type: number
 *               example: 8
 *             offer:
 *               type: number
 *               example: 3
 *             rejected:
 *               type: number
 *               example: 21
 *         thisMonth:
 *           type: number
 *           description: Applications submitted this month
 *           example: 8
 *         successRate:
 *           type: number
 *           description: Success rate percentage (offers/total)
 *           example: 6.4
 *         recentApplications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               status:
 *                 type: string
 *               dateApplied:
 *                 type: string
 *                 format: date
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         upcomingTasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               title:
 *                 type: string
 *               dueDateTime:
 *                 type: string
 *                 format: date-time
 *               taskType:
 *                 type: string
 *               jobId:
 *                 type: object
 *                 properties:
 *                   company:
 *                     type: string
 *                   position:
 *                     type: string
 *               completed:
 *                 type: boolean
 *     
 *     TimelineData:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           example: weekly
 *         timeline:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 example: "2024-W03"
 *               applications:
 *                 type: number
 *                 example: 5
 *               interviews:
 *                 type: number
 *                 example: 2
 *               offers:
 *                 type: number
 *                 example: 1
 *               rejections:
 *                 type: number
 *                 example: 2
 *     
 *     InsightsData:
 *       type: object
 *       properties:
 *         stageProgression:
 *           type: object
 *           properties:
 *             avgTimeToInterview:
 *               type: number
 *               description: Average days from application to interview
 *               example: 14
 *             avgTimeToOffer:
 *               type: number
 *               description: Average days from application to offer
 *               example: 28
 *         dayOfWeekSuccess:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 example: "Monday"
 *               successRate:
 *                 type: number
 *                 example: 12.5
 *               totalApplications:
 *                 type: number
 *                 example: 8
 *         applicationVelocity:
 *           type: object
 *           properties:
 *             avgApplicationsPerWeek:
 *               type: number
 *               example: 3.2
 *             weeklyBreakdown:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   week:
 *                     type: string
 *                     example: "2024-W03"
 *                   applications:
 *                     type: number
 *                     example: 4
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     description: Retrieve all key metrics for the dashboard including total applications, status breakdown, recent activity, and upcoming tasks
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Analytics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/DashboardAnalytics'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @swagger
 * /api/analytics/timeline:
 *   get:
 *     summary: Get timeline analytics for trends over time
 *     description: Retrieve application trends over time with configurable periods (daily, weekly, monthly)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *         description: Time period for analytics grouping
 *         example: weekly
 *     responses:
 *       200:
 *         description: Timeline analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Analytics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/TimelineData'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/timeline', protect, getTimeline);

/**
 * @swagger
 * /api/analytics/insights:
 *   get:
 *     summary: Get advanced insights and patterns
 *     description: Retrieve advanced analytics including stage progression times, success rates by day of week, company responsiveness, and application velocity
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Analytics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/InsightsData'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/insights', protect, getInsights);

module.exports = router;
