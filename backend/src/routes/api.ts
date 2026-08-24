import { Router } from 'express';
import { getRecords, getRecordById, getSummary, refreshData } from '../controllers/recordsController';
import { getDashboardTrends, getRiskDistribution, getProjects, getCategories } from '../controllers/dashboardController';
import { getNotifications, getNotificationById, markNotificationReviewed } from '../controllers/notificationsController';
import { getRecurringIssues } from '../controllers/recurringIssuesController';

const router = Router();

// Dashboard stats & charts
router.get('/dashboard/summary', getSummary);
router.get('/dashboard/trends', getDashboardTrends);
router.get('/dashboard/risk', getRiskDistribution);

// Projects & Categories
router.get('/projects', getProjects);
router.get('/categories', getCategories);

// Notifications
router.get('/notifications', getNotifications);
router.get('/notifications/:id', getNotificationById);
router.patch('/notifications/:id/review', markNotificationReviewed);

// Recurring Issues
router.get('/recurring-issues', getRecurringIssues);

// Quality Records CRUD
router.get('/records', getRecords);
router.get('/records/:id', getRecordById);

// Data Management
router.get('/refresh', refreshData);

export default router;
