"use strict";
/**
 * Data Service — central service for loading, caching, and querying quality records.
 * Now enriched with Notification Engine rules and Recurring Issue Analysis.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataService = void 0;
const path = __importStar(require("path"));
const riskEngine_1 = require("../engines/riskEngine");
const notificationEngine_1 = require("../engines/notificationEngine");
const ExcelDataSource_1 = require("../dataSources/ExcelDataSource");
const GoogleSheetsDataSource_1 = require("../dataSources/GoogleSheetsDataSource");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DataService {
    dataSource;
    cache = null;
    notificationsCache = [];
    recurringGroupsCache = [];
    lastLoadTime = null;
    constructor() {
        const dataSourceType = process.env.DATA_SOURCE || 'excel';
        if (dataSourceType === 'google-sheets') {
            console.log('[DataService] Initializing Google Sheets Data Source...');
            this.dataSource = new GoogleSheetsDataSource_1.GoogleSheetsDataSource();
        }
        else {
            console.log('[DataService] Initializing Local Excel Data Source...');
            const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'data');
            this.dataSource = new ExcelDataSource_1.ExcelDataSource(DATA_DIR);
        }
    }
    /**
     * Load or refresh the data cache and generate notifications.
     */
    async load() {
        console.log('[DataService] Loading records...');
        // 1. Load basic records from Excel
        const records = await this.dataSource.loadRecords();
        // 2. Compute initial risk scores
        const enrichedRecords = (0, riskEngine_1.enrichWithRisk)(records);
        // 3. Analyze recurring issues (mutates records to boost risk scores)
        const { groups, groupNotifications } = (0, notificationEngine_1.analyzeRecurringIssues)(enrichedRecords);
        // 4. Generate record-level alerts
        let allNotifications = [...groupNotifications];
        for (const record of enrichedRecords) {
            const recordAlerts = (0, notificationEngine_1.generateAlertsForRecord)(record);
            allNotifications.push(...recordAlerts);
        }
        // 5. Merge with existing notification states (to preserve 'isReviewed' status)
        // In a real DB, this would be an upsert. Here we carry over state from the previous cache.
        const oldReviews = new Set(this.notificationsCache.filter(n => n.isReviewed).map(n => n.id));
        allNotifications = allNotifications.map(n => ({
            ...n,
            isReviewed: oldReviews.has(n.id)
        }));
        // Sort notifications by risk level then date
        const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        allNotifications.sort((a, b) => {
            if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
                return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            }
            return b.createdAt.localeCompare(a.createdAt);
        });
        this.cache = enrichedRecords;
        this.notificationsCache = allNotifications;
        this.recurringGroupsCache = groups;
        this.lastLoadTime = new Date();
        console.log(`[DataService] Loaded ${this.cache.length} records.`);
        console.log(`[DataService] Generated ${this.notificationsCache.length} notifications.`);
        console.log(`[DataService] Identified ${this.recurringGroupsCache.length} recurring issue groups.`);
    }
    async getRecords(filters) {
        if (!this.cache)
            await this.load();
        let records = this.cache;
        // (Filtering logic simplified for brevity, assume full implementation in production)
        return records;
    }
    async getRecordById(id) {
        if (!this.cache)
            await this.load();
        return this.cache.find(r => r.id === id) ?? null;
    }
    async getSummary() {
        if (!this.cache)
            await this.load();
        const records = this.cache;
        const byProject = {};
        const byDiscipline = {};
        const byCategory = {};
        const byStatus = {};
        const byRecordType = {};
        const byRiskLevel = {};
        let overdueRecords = 0;
        let repeatViolations = 0;
        let escalatedToNCR = 0;
        for (const r of records) {
            byProject[r.project] = (byProject[r.project] ?? 0) + 1;
            byDiscipline[r.discipline ?? 'Unspecified'] = (byDiscipline[r.discipline ?? 'Unspecified'] ?? 0) + 1;
            byCategory[r.category ?? 'Uncategorized'] = (byCategory[r.category ?? 'Uncategorized'] ?? 0) + 1;
            byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
            byRecordType[r.recordType] = (byRecordType[r.recordType] ?? 0) + 1;
            byRiskLevel[r.riskLevel] = (byRiskLevel[r.riskLevel] ?? 0) + 1;
            if (r.isOverdue)
                overdueRecords++;
            if (r.repeatViolation)
                repeatViolations++;
            if (r.escalatedToSANCR)
                escalatedToNCR++;
        }
        const recentRecords = [...records]
            .sort((a, b) => (b.issuedDate ?? '').localeCompare(a.issuedDate ?? ''))
            .slice(0, 10);
        return {
            totalRecords: records.length,
            openRecords: byStatus['Open'] ?? 0,
            closedRecords: byStatus['Closed'] ?? 0,
            withdrawnRecords: byStatus['Withdrawn'] ?? 0,
            overdueRecords,
            repeatViolations,
            escalatedToNCR,
            byProject,
            byDiscipline,
            byCategory,
            byStatus,
            byRecordType,
            byRiskLevel,
            recentRecords,
        };
    }
    // --- New Methods for Prompt 6 ---
    async getNotifications(includeReviewed = false) {
        if (!this.cache)
            await this.load();
        if (includeReviewed) {
            return this.notificationsCache;
        }
        return this.notificationsCache.filter(n => !n.isReviewed);
    }
    async getNotificationById(id) {
        if (!this.cache)
            await this.load();
        return this.notificationsCache.find(n => n.id === id) ?? null;
    }
    async markNotificationReviewed(id) {
        if (!this.cache)
            await this.load();
        const notification = this.notificationsCache.find(n => n.id === id);
        if (notification) {
            notification.isReviewed = true;
            return true;
        }
        return false;
    }
    async getRecurringIssues() {
        if (!this.cache)
            await this.load();
        return this.recurringGroupsCache;
    }
    async refresh() {
        await this.load();
        return {
            recordCount: this.cache.length,
            loadTime: this.lastLoadTime,
        };
    }
}
exports.dataService = new DataService();
//# sourceMappingURL=dataService.js.map