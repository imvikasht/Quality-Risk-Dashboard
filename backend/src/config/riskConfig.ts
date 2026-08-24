/**
 * Configuration for the Risk Engine scoring system.
 * Allows easy tuning of risk weights and level thresholds.
 */

export const RISK_WEIGHTS = {
  REPEAT_VIOLATION: 30,
  OPEN_STATUS: 20,
  OVERDUE_ACD: 25,
  ESCALATED_NCR: 30,
  RECURRING_ISSUE: 25,
  MULTIPLE_OCCURRENCES: 15, // Currently not used directly at the record level, but reserved for aggregate logic
  MODERATE_SEVERITY: 15,
  MAJOR_SEVERITY: 25,
  CRITICAL_SEVERITY: 35,
};

export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 30, label: 'Low' as const },
  MEDIUM: { min: 31, max: 50, label: 'Medium' as const },
  HIGH: { min: 51, max: 70, label: 'High' as const },
  CRITICAL: { min: 71, max: 9999, label: 'Critical' as const },
};

/**
 * Determine the RiskLevel based on a calculated score.
 */
export function getRiskLevelFromScore(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= RISK_THRESHOLDS.CRITICAL.min) return RISK_THRESHOLDS.CRITICAL.label;
  if (score >= RISK_THRESHOLDS.HIGH.min) return RISK_THRESHOLDS.HIGH.label;
  if (score >= RISK_THRESHOLDS.MEDIUM.min) return RISK_THRESHOLDS.MEDIUM.label;
  return RISK_THRESHOLDS.LOW.label;
}
