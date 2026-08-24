/**
 * Core quality record types — shared data model for the dashboard.
 *
 * Both INCR (Internal Non-Conformance Report) and LBE (Letter Before Escalation)
 * records are normalized into a single QualityRecord interface.
 */
export type RecordType = 'LBE' | 'INCR' | 'UNKNOWN';
export type RecordStatus = 'Open' | 'Closed' | 'Withdrawn';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export interface QualityRecord {
    id: string;
    sourceFile: string;
    recordType: RecordType;
    serialNumber: number;
    referenceNumber: string;
    project: string;
    location: string;
    contractNumber?: string;
    notificationTitle: string;
    subject: string;
    discipline?: string;
    category?: string;
    areaOfFunction?: string;
    initiator?: string;
    contractorClosedBy?: string;
    issuedDate?: string;
    receivedDate?: string;
    acd?: string;
    acdExtended?: string;
    responseDate?: string;
    closingDate?: string;
    status: RecordStatus;
    repeatViolation: boolean;
    escalatedToSANCR: boolean;
    responseAction?: string;
    ncrSubmittalDate?: string;
    referenceDocument?: string;
    failureAndEvidence?: string;
    rootCause?: string;
    correctionProposed?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    verificationOfEffectiveness?: string;
    rfiDateForClosingNcr?: string;
    closedNcrSubmittalDate?: string;
    ncrClosedDateByCompany?: string;
    riskAndOpportunity?: string;
    typeOfViolation?: string;
    remark?: string;
}
export interface ComputedRiskFields {
    isOverdue: boolean;
    daysOverdue: number | null;
    daysToResolve: number | null;
    responseTimeDays: number | null;
    riskScore: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
}
export type QualityRecordWithRisk = QualityRecord & ComputedRiskFields;
export interface FileParsingConfig {
    fileName: string;
    sheetName: string;
    headerRow: number;
    recordType: RecordType;
    project: string;
    location: string;
    contractNumber?: string;
    columnMapping: Record<string, string>;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        total: number;
        filtered?: number;
        page?: number;
        pageSize?: number;
    };
}
export interface ApiError {
    success: false;
    error: string;
    details?: string;
}
export interface DashboardSummary {
    totalRecords: number;
    openRecords: number;
    closedRecords: number;
    withdrawnRecords: number;
    overdueRecords: number;
    repeatViolations: number;
    escalatedToNCR: number;
    byProject: Record<string, number>;
    byDiscipline: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byRecordType: Record<string, number>;
    byRiskLevel: Record<string, number>;
    recentRecords: QualityRecordWithRisk[];
}
//# sourceMappingURL=quality.d.ts.map