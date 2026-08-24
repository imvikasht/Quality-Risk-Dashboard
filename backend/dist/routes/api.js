"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recordsController_1 = require("../controllers/recordsController");
const dashboardController_1 = require("../controllers/dashboardController");
const notificationsController_1 = require("../controllers/notificationsController");
const recurringIssuesController_1 = require("../controllers/recurringIssuesController");
const router = (0, express_1.Router)();
// Dashboard stats & charts
router.get('/dashboard/summary', recordsController_1.getSummary);
router.get('/dashboard/trends', dashboardController_1.getDashboardTrends);
router.get('/dashboard/risk', dashboardController_1.getRiskDistribution);
// Projects & Categories
router.get('/projects', dashboardController_1.getProjects);
router.get('/categories', dashboardController_1.getCategories);
// Notifications
router.get('/notifications', notificationsController_1.getNotifications);
router.get('/notifications/:id', notificationsController_1.getNotificationById);
router.patch('/notifications/:id/review', notificationsController_1.markNotificationReviewed);
// Recurring Issues
router.get('/recurring-issues', recurringIssuesController_1.getRecurringIssues);
// Quality Records CRUD
router.get('/records', recordsController_1.getRecords);
router.get('/records/:id', recordsController_1.getRecordById);
// Data Management
router.get('/refresh', recordsController_1.refreshData);
exports.default = router;
//# sourceMappingURL=api.js.map