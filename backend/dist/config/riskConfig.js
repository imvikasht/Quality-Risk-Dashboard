"use strict";
/**
 * Configuration for the Risk Engine scoring system.
 * Allows easy tuning of risk weights and level thresholds.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RISK_THRESHOLDS = exports.RISK_WEIGHTS = void 0;
exports.getRiskLevelFromScore = getRiskLevelFromScore;
exports.RISK_WEIGHTS = {
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
exports.RISK_THRESHOLDS = {
    LOW: { min: 0, max: 30, label: 'Low' },
    MEDIUM: { min: 31, max: 50, label: 'Medium' },
    HIGH: { min: 51, max: 70, label: 'High' },
    CRITICAL: { min: 71, max: 9999, label: 'Critical' },
};
/**
 * Determine the RiskLevel based on a calculated score.
 */
function getRiskLevelFromScore(score) {
    if (score >= exports.RISK_THRESHOLDS.CRITICAL.min)
        return exports.RISK_THRESHOLDS.CRITICAL.label;
    if (score >= exports.RISK_THRESHOLDS.HIGH.min)
        return exports.RISK_THRESHOLDS.HIGH.label;
    if (score >= exports.RISK_THRESHOLDS.MEDIUM.min)
        return exports.RISK_THRESHOLDS.MEDIUM.label;
    return exports.RISK_THRESHOLDS.LOW.label;
}
//# sourceMappingURL=riskConfig.js.map