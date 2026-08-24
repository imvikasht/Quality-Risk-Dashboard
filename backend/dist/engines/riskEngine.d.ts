/**
 * Risk Engine — computes risk scores and overdue status for quality records.
 * Uses a configurable scoring system to explain "Why is this issue HIGH risk?".
 */
import { QualityRecord, QualityRecordWithRisk, ComputedRiskFields } from '../types/quality';
/**
 * Compute risk fields for a single quality record based on the configurable scoring system.
 */
export declare function computeRisk(record: QualityRecord, referenceDate?: string): ComputedRiskFields;
/**
 * Enrich an array of QualityRecords with computed risk fields.
 */
export declare function enrichWithRisk(records: QualityRecord[], referenceDate?: string): QualityRecordWithRisk[];
//# sourceMappingURL=riskEngine.d.ts.map