"use strict";
/**
 * Notification Engine — Analyzes quality records and generates alerts.
 * Implements Rules 1-6 as defined in requirements.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAlertsForRecord = generateAlertsForRecord;
exports.analyzeRecurringIssues = analyzeRecurringIssues;
const dayjs_1 = __importDefault(require("dayjs"));
const notification_1 = require("../types/notification");
const riskConfig_1 = require("../config/riskConfig");
// Dictionary for deterministic similarity grouping (Rule 6)
// Keys are the group ID, values are match terms
const ISSUE_DICTIONARY = {
    'weld-identification': {
        name: 'Weld Identification & Traceability',
        terms: ['weld identification', 'welder identification', 'traceability', 'weld symbol']
    },
    'welding-execution': {
        name: 'Welding Execution & Defect',
        terms: ['weld', 'welding', 'welder', 'slag', 'porosity', 'undercut', 'crack']
    },
    'drawing-compliance': {
        name: 'Drawing & Specification Compliance',
        terms: ['drawing', 'specification', 'dimension', 'distance', 'tolerance', 'not meeting']
    },
    'material-inspection': {
        name: 'Material Receiving & Inspection',
        terms: ['material', 'receiving', 'inspection', 'mri']
    },
    'wps-compliance': {
        name: 'WPS Parameter Compliance',
        terms: ['wps', 'parameter', 'voltage', 'amperage', 'travel speed']
    },
    'electrode-handling': {
        name: 'Electrode Handling',
        terms: ['electrode', 'oven', 'baking', 'quiver']
    },
    'fit-up': {
        name: 'Joint Fit-up',
        terms: ['fit-up', 'fitup', 'gap', 'bevel']
    }
};
/**
 * Creates a deterministic notification ID based on record ID and rule type.
 */
function generateNotificationId(recordId, type) {
    return `${recordId}-${type}`;
}
/**
 * Helper to build the base notification object from a record.
 */
function buildBaseNotification(record, type, reason) {
    return {
        id: generateNotificationId(record.id, type),
        type,
        recordId: record.id,
        project: record.project,
        location: record.location,
        referenceNumber: record.referenceNumber,
        notificationTitle: record.notificationTitle,
        subject: record.subject,
        category: record.category,
        discipline: record.discipline,
        riskScore: record.riskScore,
        riskLevel: record.riskLevel,
        riskFactors: [...record.riskFactors], // clone array
        reason,
        sourceFile: record.sourceFile,
        createdAt: new Date().toISOString(),
        isReviewed: false,
    };
}
/**
 * Generate individual alerts (Rules 1-5) for a given record.
 */
function generateAlertsForRecord(record, referenceDate) {
    const notifications = [];
    const today = referenceDate ? (0, dayjs_1.default)(referenceDate) : (0, dayjs_1.default)();
    // Rule 1 — Repeat Violation
    if (record.repeatViolation) {
        notifications.push(buildBaseNotification(record, notification_1.NotificationType.REPEAT_VIOLATION, 'Repeat violation detected'));
    }
    // Rule 2 — Open Quality Issue
    if (record.status === 'Open') {
        notifications.push(buildBaseNotification(record, notification_1.NotificationType.OPEN_QUALITY_ISSUE, 'Issue is currently open'));
    }
    // Rule 5 — Escalated NCR
    if (record.escalatedToSANCR) {
        notifications.push(buildBaseNotification(record, notification_1.NotificationType.ESCALATED_NCR, 'Issue escalated to SA NCR'));
    }
    // Time-based rules (3 & 4) only apply to Open records with an ACD
    if (record.status !== 'Closed' && record.acd) {
        const acdDate = (0, dayjs_1.default)(record.acd);
        if (acdDate.isValid()) {
            // Rule 3 — Overdue ACD
            if (today.isAfter(acdDate, 'day')) {
                const days = today.diff(acdDate, 'day');
                notifications.push(buildBaseNotification(record, notification_1.NotificationType.OVERDUE_ACD, `ACD is overdue by ${days} day(s)`));
            }
            // Rule 4 — ACD Due Soon
            else {
                const daysUntil = acdDate.diff(today, 'day');
                if (daysUntil >= 0 && daysUntil <= 3) {
                    notifications.push(buildBaseNotification(record, notification_1.NotificationType.ACD_DUE_SOON, `ACD is due in ${daysUntil} day(s)`));
                }
            }
        }
    }
    return notifications;
}
/**
 * Implements Rule 6: Recurring Issue Grouping.
 * Analyzes the entire dataset to find semantic matches based on the dictionary.
 */
function analyzeRecurringIssues(records) {
    const groupsMap = new Map();
    // 1. Group records by matching terms in Title + Subject
    for (const record of records) {
        const textToAnalyze = `${record.notificationTitle} ${record.subject}`.toLowerCase();
        // Find the first matching dictionary group
        // Note: A more complex implementation could allow a record to belong to multiple groups
        for (const [groupId, dict] of Object.entries(ISSUE_DICTIONARY)) {
            const isMatch = dict.terms.some(term => textToAnalyze.includes(term.toLowerCase()));
            if (isMatch) {
                if (!groupsMap.has(groupId)) {
                    groupsMap.set(groupId, []);
                }
                groupsMap.get(groupId).push(record);
                // Boost the record's risk score dynamically since it's part of a recurring issue
                record.riskScore += riskConfig_1.RISK_WEIGHTS.RECURRING_ISSUE;
                record.riskFactors.push(`Part of recurring issue group (+${riskConfig_1.RISK_WEIGHTS.RECURRING_ISSUE})`);
                record.riskLevel = (0, riskConfig_1.getRiskLevelFromScore)(record.riskScore);
                break; // Only assign to the first matching group for simplicity
            }
        }
    }
    const groups = [];
    const groupNotifications = [];
    // 2. Build the group models
    for (const [groupId, groupRecords] of groupsMap.entries()) {
        if (groupRecords.length < 2)
            continue; // Only care if it happens multiple times
        const dictInfo = ISSUE_DICTIONARY[groupId];
        // Sort records by issue date
        const sorted = [...groupRecords].sort((a, b) => {
            const da = a.issuedDate || '1970-01-01';
            const db = b.issuedDate || '1970-01-01';
            return da.localeCompare(db);
        });
        const projects = new Set(groupRecords.map(r => r.project));
        let openCount = 0;
        let repeatCount = 0;
        let totalScore = 0;
        for (const r of groupRecords) {
            if (r.status === 'Open')
                openCount++;
            if (r.repeatViolation)
                repeatCount++;
            totalScore += r.riskScore;
        }
        // Determine an aggregate risk level for the group itself
        // Simple average + boost for multiple projects or many occurrences
        let aggregateScore = totalScore / groupRecords.length;
        if (projects.size > 1)
            aggregateScore += 10;
        if (groupRecords.length > 3)
            aggregateScore += 10;
        const aggregateLevel = (0, riskConfig_1.getRiskLevelFromScore)(aggregateScore);
        const group = {
            id: groupId,
            groupName: dictInfo.name,
            occurrences: groupRecords.length,
            projectsAffected: Array.from(projects),
            firstOccurrence: sorted[0].issuedDate,
            latestOccurrence: sorted[sorted.length - 1].issuedDate,
            openOccurrences: openCount,
            repeatViolations: repeatCount,
            aggregateRiskScore: aggregateScore,
            aggregateRiskLevel: aggregateLevel,
            relatedRecords: sorted.map(r => ({
                id: r.id,
                referenceNumber: r.referenceNumber,
                project: r.project,
                status: r.status,
                notificationTitle: r.notificationTitle,
                subject: r.subject,
                issuedDate: r.issuedDate,
                riskScore: r.riskScore,
                riskLevel: r.riskLevel
            }))
        };
        groups.push(group);
        // 3. Generate a summary notification for the group
        // We bind it to the most recent record as a representative anchor
        const latestRecord = sorted[sorted.length - 1];
        groupNotifications.push({
            id: `recurring-group-${groupId}`,
            type: notification_1.NotificationType.RECURRING_QUALITY_ISSUE,
            recordId: latestRecord.id, // Anchor record
            project: 'Multiple', // It might span projects
            location: 'Multiple',
            referenceNumber: `Group: ${groupRecords.length} records`,
            notificationTitle: `Recurring Issue: ${dictInfo.name}`,
            subject: `Detected ${groupRecords.length} occurrences across ${projects.size} project(s).`,
            category: 'Systemic',
            riskScore: aggregateScore,
            riskLevel: aggregateLevel,
            riskFactors: [`Multiple occurrences (${groupRecords.length})`, `Projects affected: ${projects.size}`],
            reason: 'Frequent occurrence of similar issues',
            sourceFile: 'Multiple',
            createdAt: new Date().toISOString(),
            isReviewed: false,
            relatedRecordIds: sorted.map(r => r.id)
        });
    }
    // Sort groups by highest risk first
    groups.sort((a, b) => b.aggregateRiskScore - a.aggregateRiskScore);
    return { groups, groupNotifications };
}
//# sourceMappingURL=notificationEngine.js.map