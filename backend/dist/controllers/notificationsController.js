"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.getNotificationById = getNotificationById;
exports.markNotificationReviewed = markNotificationReviewed;
const dataService_1 = require("../services/dataService");
async function getNotifications(req, res) {
    try {
        const includeReviewed = req.query.includeReviewed === 'true';
        const notifications = await dataService_1.dataService.getNotifications(includeReviewed);
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
}
async function getNotificationById(req, res) {
    try {
        const id = req.params.id;
        const notification = await dataService_1.dataService.getNotificationById(id);
        if (!notification) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }
        res.json({ success: true, data: notification });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch notification' });
    }
}
async function markNotificationReviewed(req, res) {
    try {
        const id = req.params.id;
        const success = await dataService_1.dataService.markNotificationReviewed(id);
        if (!success) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }
        res.json({ success: true, data: { reviewed: true } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to review notification' });
    }
}
//# sourceMappingURL=notificationsController.js.map