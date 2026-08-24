/**
 * Notification Engine — Analyzes quality records and generates alerts.
 * Implements Rules 1-6 as defined in requirements.
 */

import dayjs from 'dayjs';
import { QualityRecordWithRisk } from '../types/quality';
import { Notification, NotificationType, RecurringIssueGroup } from '../types/notification';
import { getRiskLevelFromScore, RISK_WEIGHTS } from '../config/riskConfig';

// Dictionary for deterministic similarity grouping (Rule 6)
// Keys are the group ID, values are match terms
const ISSUE_DICTIONARY: Record<string, { name: string, terms: string[] }> = {
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
function generateNotificationId(recordId: string, type: NotificationType): string {
  return `${recordId}-${type}`;
}

/**
 * Helper to build the base notification object from a record.
 */
function buildBaseNotification(
  record: QualityRecordWithRisk,
  type: NotificationType,
  reason: string
): Notification {
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
export function generateAlertsForRecord(
  record: QualityRecordWithRisk,
  referenceDate?: string
): Notification[] {
  const notifications: Notification[] = [];
  const today = referenceDate ? dayjs(referenceDate) : dayjs();

  // Rule 1 — Repeat Violation
  if (record.repeatViolation) {
    notifications.push(
      buildBaseNotification(record, NotificationType.REPEAT_VIOLATION, 'Repeat violation detected')
    );
  }

  // Rule 2 — Open Quality Issue
  if (record.status === 'Open') {
    notifications.push(
      buildBaseNotification(record, NotificationType.OPEN_QUALITY_ISSUE, 'Issue is currently open')
    );
  }

  // Rule 5 — Escalated NCR
  if (record.escalatedToSANCR) {
    notifications.push(
      buildBaseNotification(record, NotificationType.ESCALATED_NCR, 'Issue escalated to SA NCR')
    );
  }

  // Time-based rules (3 & 4) only apply to Open records with an ACD
  if (record.status !== 'Closed' && record.acd) {
    const acdDate = dayjs(record.acd);
    
    if (acdDate.isValid()) {
      // Rule 3 — Overdue ACD
      if (today.isAfter(acdDate, 'day')) {
        const days = today.diff(acdDate, 'day');
        notifications.push(
          buildBaseNotification(record, NotificationType.OVERDUE_ACD, `ACD is overdue by ${days} day(s)`)
        );
      } 
      // Rule 4 — ACD Due Soon
      else {
        const daysUntil = acdDate.diff(today, 'day');
        if (daysUntil >= 0 && daysUntil <= 3) {
          notifications.push(
            buildBaseNotification(record, NotificationType.ACD_DUE_SOON, `ACD is due in ${daysUntil} day(s)`)
          );
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
export function analyzeRecurringIssues(records: QualityRecordWithRisk[]): {
  groups: RecurringIssueGroup[],
  groupNotifications: Notification[],
  // Mutates records to boost their risk scores if they belong to a recurring issue
} {
  const groupsMap = new Map<string, QualityRecordWithRisk[]>();

  // 1. Group records by matching terms in relevant fields depending on source file
  for (const record of records) {
    let textParts: (string | undefined)[] = [];

    if (record.sourceFile.includes('LBE')) {
      // CRPO-160-LBE LOG and Dorra LBE LOG
      textParts = [record.notificationTitle, record.subject, record.responseAction];
    } else if (record.sourceFile.includes('CRPO-160-INCR LOG')) {
      // CRPO-160-INCR LOG - Hazira Yard
      textParts = [record.notificationTitle, record.subject, record.failureAndEvidence, record.preventiveAction];
    } else if (record.sourceFile.includes('Dorra INCR LOG')) {
      // Dorra INCR LOG
      textParts = [
        record.failureAndEvidence,
        record.rootCause,
        record.correctionProposed,
        record.correctiveAction, // Mapped from 'Corrective Action/Preventive Action Proposed'
        record.verificationOfEffectiveness // Mapped from 'Verification of Correction and Corrective/Preventive Action'
      ];
    } else {
      textParts = [record.notificationTitle, record.subject];
    }

    const textToAnalyze = textParts.filter(Boolean).join(' ').toLowerCase();
    
    // Find the first matching dictionary group
    // Note: A more complex implementation could allow a record to belong to multiple groups
    for (const [groupId, dict] of Object.entries(ISSUE_DICTIONARY)) {
      const isMatch = dict.terms.some(term => textToAnalyze.includes(term.toLowerCase()));
      if (isMatch) {
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, []);
        }
        groupsMap.get(groupId)!.push(record);
        
        // Boost the record's risk score dynamically since it's part of a recurring issue
        record.riskScore += RISK_WEIGHTS.RECURRING_ISSUE;
        record.riskFactors.push(`Part of recurring issue group (+${RISK_WEIGHTS.RECURRING_ISSUE})`);
        record.riskLevel = getRiskLevelFromScore(record.riskScore);
        
        break; // Only assign to the first matching group for simplicity
      }
    }
  }

  const groups: RecurringIssueGroup[] = [];
  const groupNotifications: Notification[] = [];

  // 2. Build the group models
  for (const [groupId, groupRecords] of groupsMap.entries()) {
    if (groupRecords.length < 2) continue; // Only care if it happens multiple times

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
      if (r.status === 'Open') openCount++;
      if (r.repeatViolation) repeatCount++;
      totalScore += r.riskScore;
    }

    // Determine an aggregate risk level for the group itself
    // Simple average + boost for multiple projects or many occurrences
    let aggregateScore = totalScore / groupRecords.length;
    if (projects.size > 1) aggregateScore += 10;
    if (groupRecords.length > 3) aggregateScore += 10;
    const aggregateLevel = getRiskLevelFromScore(aggregateScore);

    const group: RecurringIssueGroup = {
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
      type: NotificationType.RECURRING_QUALITY_ISSUE,
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
