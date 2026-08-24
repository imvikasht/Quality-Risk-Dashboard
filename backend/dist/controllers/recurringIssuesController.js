"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecurringIssues = getRecurringIssues;
const dataService_1 = require("../services/dataService");
async function getRecurringIssues(req, res) {
    try {
        const issues = await dataService_1.dataService.getRecurringIssues();
        res.json({ success: true, data: issues });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch recurring issues' });
    }
}
//# sourceMappingURL=recurringIssuesController.js.map