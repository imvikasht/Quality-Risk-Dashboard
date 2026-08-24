/**
 * Configuration for the Risk Engine scoring system.
 * Allows easy tuning of risk weights and level thresholds.
 */
export declare const RISK_WEIGHTS: {
    REPEAT_VIOLATION: number;
    OPEN_STATUS: number;
    OVERDUE_ACD: number;
    ESCALATED_NCR: number;
    RECURRING_ISSUE: number;
    MULTIPLE_OCCURRENCES: number;
    MODERATE_SEVERITY: number;
    MAJOR_SEVERITY: number;
    CRITICAL_SEVERITY: number;
};
export declare const RISK_THRESHOLDS: {
    LOW: {
        min: number;
        max: number;
        label: "Low";
    };
    MEDIUM: {
        min: number;
        max: number;
        label: "Medium";
    };
    HIGH: {
        min: number;
        max: number;
        label: "High";
    };
    CRITICAL: {
        min: number;
        max: number;
        label: "Critical";
    };
};
/**
 * Determine the RiskLevel based on a calculated score.
 */
export declare function getRiskLevelFromScore(score: number): 'Low' | 'Medium' | 'High' | 'Critical';
//# sourceMappingURL=riskConfig.d.ts.map