"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardTrends = getDashboardTrends;
exports.getRiskDistribution = getRiskDistribution;
exports.getProjects = getProjects;
exports.getCategories = getCategories;
const dataService_1 = require("../services/dataService");
const dayjs_1 = __importDefault(require("dayjs"));
/**
 * GET /api/dashboard/trends
 * Returns monthly NCR/quality trends
 */
async function getDashboardTrends(req, res) {
    try {
        const records = await dataService_1.dataService.getRecords();
        // Group records by month (YYYY-MM)
        const trendsMap = new Map();
        for (const record of records) {
            if (!record.issuedDate)
                continue;
            const month = (0, dayjs_1.default)(record.issuedDate).format('YYYY-MM');
            if (!trendsMap.has(month)) {
                trendsMap.set(month, { month, incr: 0, lbe: 0 });
            }
            const entry = trendsMap.get(month);
            if (record.recordType === 'INCR') {
                entry.incr++;
            }
            else if (record.recordType === 'LBE') {
                entry.lbe++;
            }
        }
        // Convert to sorted array
        const data = Array.from(trendsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching dashboard trends:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard trends' });
    }
}
/**
 * GET /api/dashboard/risk
 * Returns the risk distribution
 */
async function getRiskDistribution(req, res) {
    try {
        const records = await dataService_1.dataService.getRecords();
        const distribution = {
            Low: 0,
            Medium: 0,
            High: 0,
            Critical: 0
        };
        for (const record of records) {
            if (record.riskLevel in distribution) {
                distribution[record.riskLevel]++;
            }
        }
        // Format for Recharts PieChart
        const data = [
            { name: 'Critical', value: distribution.Critical, fill: '#ef4444' }, // red-500
            { name: 'High', value: distribution.High, fill: '#f97316' }, // orange-500
            { name: 'Medium', value: distribution.Medium, fill: '#eab308' }, // yellow-500
            { name: 'Low', value: distribution.Low, fill: '#22c55e' } // green-500
        ].filter(item => item.value > 0);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching risk distribution:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch risk distribution' });
    }
}
/**
 * GET /api/projects
 * Returns a list of all distinct projects and some basic stats for them
 */
async function getProjects(req, res) {
    try {
        const records = await dataService_1.dataService.getRecords();
        const projectsMap = new Map();
        for (const r of records) {
            if (!projectsMap.has(r.project)) {
                projectsMap.set(r.project, {
                    name: r.project,
                    totalRecords: 0,
                    openRecords: 0,
                    criticalRecords: 0
                });
            }
            const p = projectsMap.get(r.project);
            p.totalRecords++;
            if (r.status === 'Open')
                p.openRecords++;
            if (r.riskLevel === 'Critical')
                p.criticalRecords++;
        }
        res.json({ success: true, data: Array.from(projectsMap.values()) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
}
/**
 * GET /api/categories
 * Returns a list of all distinct categories
 */
async function getCategories(req, res) {
    try {
        const records = await dataService_1.dataService.getRecords();
        const categories = Array.from(new Set(records.map(r => r.category).filter(Boolean)));
        res.json({ success: true, data: categories });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
}
//# sourceMappingURL=dashboardController.js.map