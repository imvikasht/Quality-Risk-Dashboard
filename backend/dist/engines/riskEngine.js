"use strict";
/**
 * Risk Engine — computes risk scores and overdue status for quality records.
 * Uses a configurable scoring system to explain "Why is this issue HIGH risk?".
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRisk = computeRisk;
exports.enrichWithRisk = enrichWithRisk;
const dayjs_1 = __importDefault(require("dayjs"));
const riskConfig_1 = require("../config/riskConfig");
/**
 * Compute risk fields for a single quality record based on the configurable scoring system.
 */
function computeRisk(record, referenceDate) {
    const today = referenceDate ? (0, dayjs_1.default)(referenceDate) : (0, dayjs_1.default)();
    const riskFactors = [];
    let riskScore = 0;
    // ─── Overdue calculation ─────────────────────────────────────────────
    let isOverdue = false;
    let daysOverdue = null;
    if (record.status === 'Open' && record.acd) {
        const acdDate = (0, dayjs_1.default)(record.acd);
        if (acdDate.isValid() && today.isAfter(acdDate)) {
            isOverdue = true;
            daysOverdue = today.diff(acdDate, 'day');
            riskScore += riskConfig_1.RISK_WEIGHTS.OVERDUE_ACD;
            riskFactors.push(`Overdue ACD by ${daysOverdue} day(s) (+${riskConfig_1.RISK_WEIGHTS.OVERDUE_ACD})`);
        }
    }
    // ─── Status ──────────────────────────────────────────────────────────
    if (record.status === 'Open') {
        riskScore += riskConfig_1.RISK_WEIGHTS.OPEN_STATUS;
        riskFactors.push(`Open status (+${riskConfig_1.RISK_WEIGHTS.OPEN_STATUS})`);
    }
    // ─── Repeat Violation ────────────────────────────────────────────────
    if (record.repeatViolation) {
        riskScore += riskConfig_1.RISK_WEIGHTS.REPEAT_VIOLATION;
        riskFactors.push(`Repeat violation (+${riskConfig_1.RISK_WEIGHTS.REPEAT_VIOLATION})`);
    }
    // ─── Escalated NCR ───────────────────────────────────────────────────
    if (record.escalatedToSANCR) {
        riskScore += riskConfig_1.RISK_WEIGHTS.ESCALATED_NCR;
        riskFactors.push(`Escalated to SA NCR (+${riskConfig_1.RISK_WEIGHTS.ESCALATED_NCR})`);
    }
    // ─── Severity Category ───────────────────────────────────────────────
    if (record.category === 'Moderate') {
        riskScore += riskConfig_1.RISK_WEIGHTS.MODERATE_SEVERITY;
        riskFactors.push(`Moderate severity (+${riskConfig_1.RISK_WEIGHTS.MODERATE_SEVERITY})`);
    }
    else if (record.category === 'Major') {
        riskScore += riskConfig_1.RISK_WEIGHTS.MAJOR_SEVERITY;
        riskFactors.push(`Major severity (+${riskConfig_1.RISK_WEIGHTS.MAJOR_SEVERITY})`);
    }
    else if (record.category === 'Critical') {
        riskScore += riskConfig_1.RISK_WEIGHTS.CRITICAL_SEVERITY;
        riskFactors.push(`Critical severity (+${riskConfig_1.RISK_WEIGHTS.CRITICAL_SEVERITY})`);
    }
    // Note: The "Recurring issue (+25)" score is added dynamically by the 
    // NotificationEngine/DataService when groups are formed, because it requires
    // evaluating records against each other.
    // ─── Resolution time ────────────────────────────────────────────────
    let daysToResolve = null;
    if (record.closingDate && record.issuedDate) {
        const issued = (0, dayjs_1.default)(record.issuedDate);
        const closed = (0, dayjs_1.default)(record.closingDate);
        if (issued.isValid() && closed.isValid()) {
            daysToResolve = closed.diff(issued, 'day');
        }
    }
    // ─── Response time ──────────────────────────────────────────────────
    let responseTimeDays = null;
    if (record.responseDate && record.issuedDate) {
        const issued = (0, dayjs_1.default)(record.issuedDate);
        const response = (0, dayjs_1.default)(record.responseDate);
        if (issued.isValid() && response.isValid()) {
            responseTimeDays = response.diff(issued, 'day');
        }
    }
    const riskLevel = (0, riskConfig_1.getRiskLevelFromScore)(riskScore);
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
function enrichWithRisk(records, referenceDate) {
    return records.map(record => ({
        ...record,
        ...computeRisk(record, referenceDate),
    }));
}
//# sourceMappingURL=riskEngine.js.map