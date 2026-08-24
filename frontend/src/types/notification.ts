import type { RiskLevel } from './quality';

export const NotificationType = {
  REPEAT_VIOLATION: 'REPEAT_VIOLATION',
  OPEN_QUALITY_ISSUE: 'OPEN_QUALITY_ISSUE',
  OVERDUE_ACD: 'OVERDUE_ACD',
  ACD_DUE_SOON: 'ACD_DUE_SOON',
  ESCALATED_NCR: 'ESCALATED_NCR',
  RECURRING_QUALITY_ISSUE: 'RECURRING_QUALITY_ISSUE'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
  id: string; // Deterministic ID to prevent duplicates (e.g., recordId-type)
  type: NotificationType;
  
  // Record context
  recordId: string;
  project: string;
  location: string;
  referenceNumber: string; // LBE/INCR No.
  
  // Problem description
  notificationTitle: string;
  subject: string;
  category?: string;
  discipline?: string;
  
  // Risk fields
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  
  // Specific alert reason
  reason: string;
  
  // Meta
  sourceFile: string;
  createdAt: string; // ISO timestamp
  isReviewed: boolean;
  
  // Useful for grouping/linking
  relatedRecordIds?: string[];
}

export interface RecurringIssueGroup {
  id: string; // e.g. the primary keyword or phrase
  groupName: string;
  occurrences: number;
  projectsAffected: string[];
  firstOccurrence?: string;
  latestOccurrence?: string;
  openOccurrences: number;
  repeatViolations: number;
  
  // Derived risk for the whole group based on its members
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
