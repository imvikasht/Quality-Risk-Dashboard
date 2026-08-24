import type { RiskLevel } from './quality';
export declare const NotificationType: {
    readonly REPEAT_VIOLATION: "REPEAT_VIOLATION";
    readonly OPEN_QUALITY_ISSUE: "OPEN_QUALITY_ISSUE";
    readonly OVERDUE_ACD: "OVERDUE_ACD";
    readonly ACD_DUE_SOON: "ACD_DUE_SOON";
    readonly ESCALATED_NCR: "ESCALATED_NCR";
    readonly RECURRING_QUALITY_ISSUE: "RECURRING_QUALITY_ISSUE";
};
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
export interface Notification {
    id: string;
    type: NotificationType;
    recordId: string;
    project: string;
    location: string;
    referenceNumber: string;
    notificationTitle: string;
    subject: string;
    category?: string;
    discipline?: string;
    riskScore: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
    reason: string;
    sourceFile: string;
    createdAt: string;
    isReviewed: boolean;
    relatedRecordIds?: string[];
}
export interface RecurringIssueGroup {
    id: string;
    groupName: string;
    occurrences: number;
    projectsAffected: string[];
    firstOccurrence?: string;
    latestOccurrence?: string;
    openOccurrences: number;
    repeatViolations: number;
    aggregateRiskScore: number;
    aggregateRiskLevel: RiskLevel;
    relatedRecords: {
        id: string;
        referenceNumber: string;
        project: string;
        status: string;
        notificationTitle: string;
        subject: string;
        issuedDate?: string;
        riskScore: number;
        riskLevel: RiskLevel;
    }[];
}
//# sourceMappingURL=notification.d.ts.map