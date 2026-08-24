/**
 * Notification Engine — Analyzes quality records and generates alerts.
 * Implements Rules 1-6 as defined in requirements.
 */
import { QualityRecordWithRisk } from '../types/quality';
import { Notification, RecurringIssueGroup } from '../types/notification';
/**
 * Generate individual alerts (Rules 1-5) for a given record.
 */
export declare function generateAlertsForRecord(record: QualityRecordWithRisk, referenceDate?: string): Notification[];
/**
 * Implements Rule 6: Recurring Issue Grouping.
 * Analyzes the entire dataset to find semantic matches based on the dictionary.
 */
export declare function analyzeRecurringIssues(records: QualityRecordWithRisk[]): {
    groups: RecurringIssueGroup[];
    groupNotifications: Notification[];
};
//# sourceMappingURL=notificationEngine.d.ts.map