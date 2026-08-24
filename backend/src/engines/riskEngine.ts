/**
 * Risk Engine — computes risk scores and overdue status for quality records.
 * Uses a configurable scoring system to explain "Why is this issue HIGH risk?".
 */

import dayjs from 'dayjs';
import { QualityRecord, QualityRecordWithRisk, ComputedRiskFields } from '../types/quality';
import { RISK_WEIGHTS, getRiskLevelFromScore } from '../config/riskConfig';

/**
 * Compute risk fields for a single quality record based on the configurable scoring system.
 */
export function computeRisk(record: QualityRecord, referenceDate?: string): ComputedRiskFields {
  const today = referenceDate ? dayjs(referenceDate) : dayjs();
  const riskFactors: string[] = [];
  let riskScore = 0;

  // ─── Overdue calculation ─────────────────────────────────────────────
  let isOverdue = false;
  let daysOverdue: number | null = null;

  if (record.status === 'Open' && record.acd) {
    const acdDate = dayjs(record.acd);
    if (acdDate.isValid() && today.isAfter(acdDate)) {
      isOverdue = true;
      daysOverdue = today.diff(acdDate, 'day');
      
      riskScore += RISK_WEIGHTS.OVERDUE_ACD;
      riskFactors.push(`Overdue ACD by ${daysOverdue} day(s) (+${RISK_WEIGHTS.OVERDUE_ACD})`);
    }
  }

  // ─── Status ──────────────────────────────────────────────────────────
  if (record.status === 'Open') {
    riskScore += RISK_WEIGHTS.OPEN_STATUS;
    riskFactors.push(`Open status (+${RISK_WEIGHTS.OPEN_STATUS})`);
  }

  // ─── Repeat Violation ────────────────────────────────────────────────
  if (record.repeatViolation) {
    riskScore += RISK_WEIGHTS.REPEAT_VIOLATION;
    riskFactors.push(`Repeat violation (+${RISK_WEIGHTS.REPEAT_VIOLATION})`);
  }

  // ─── Escalated NCR ───────────────────────────────────────────────────
  if (record.escalatedToSANCR) {
    riskScore += RISK_WEIGHTS.ESCALATED_NCR;
    riskFactors.push(`Escalated to SA NCR (+${RISK_WEIGHTS.ESCALATED_NCR})`);
  }

  // ─── Severity Category ───────────────────────────────────────────────
  if (record.category === 'Moderate') {
    riskScore += RISK_WEIGHTS.MODERATE_SEVERITY;
    riskFactors.push(`Moderate severity (+${RISK_WEIGHTS.MODERATE_SEVERITY})`);
  } else if (record.category === 'Major') {
    riskScore += RISK_WEIGHTS.MAJOR_SEVERITY;
    riskFactors.push(`Major severity (+${RISK_WEIGHTS.MAJOR_SEVERITY})`);
  } else if (record.category === 'Critical') {
    riskScore += RISK_WEIGHTS.CRITICAL_SEVERITY;
    riskFactors.push(`Critical severity (+${RISK_WEIGHTS.CRITICAL_SEVERITY})`);
  }

  // Note: The "Recurring issue (+25)" score is added dynamically by the 
  // NotificationEngine/DataService when groups are formed, because it requires
  // evaluating records against each other.

  // ─── Resolution time ────────────────────────────────────────────────
  let daysToResolve: number | null = null;
  if (record.closingDate && record.issuedDate) {
    const issued = dayjs(record.issuedDate);
    const closed = dayjs(record.closingDate);
    if (issued.isValid() && closed.isValid()) {
      daysToResolve = closed.diff(issued, 'day');
    }
  }

  // ─── Response time ──────────────────────────────────────────────────
  let responseTimeDays: number | null = null;
  if (record.responseDate && record.issuedDate) {
    const issued = dayjs(record.issuedDate);
    const response = dayjs(record.responseDate);
    if (issued.isValid() && response.isValid()) {
      responseTimeDays = response.diff(issued, 'day');
    }
  }

  const riskLevel = getRiskLevelFromScore(riskScore);

  return {
    isOverdue,
    daysOverdue,
    daysToResolve,
    responseTimeDays,
    riskScore,
    riskLevel,
    riskFactors,
  };
}

/**
 * Enrich an array of QualityRecords with computed risk fields.
 */
export function enrichWithRisk(
  records: QualityRecord[],
  referenceDate?: string
): QualityRecordWithRisk[] {
  return records.map(record => ({
    ...record,
    ...computeRisk(record, referenceDate),
  }));
}
