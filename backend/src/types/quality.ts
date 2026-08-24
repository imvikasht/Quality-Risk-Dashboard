/**
 * Core quality record types — shared data model for the dashboard.
 *
 * Both INCR (Internal Non-Conformance Report) and LBE (Letter Before Escalation)
 * records are normalized into a single QualityRecord interface.
 */

// ─── Record Type Discriminator ───────────────────────────────────────────────

export type RecordType = 'LBE' | 'INCR' | 'UNKNOWN';

export type RecordStatus = 'Open' | 'Closed' | 'Withdrawn';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

// ─── Main Quality Record ─────────────────────────────────────────────────────

export interface QualityRecord {
  // === Identity ===
  id: string;
  sourceFile: string;
  recordType: RecordType;
  serialNumber: number;
  referenceNumber: string;

  // === Project Context ===
  project: string;
  location: string;
  contractNumber?: string;

  // === Problem Description (Primary Fields) ===
  notificationTitle: string;
  subject: string;

  // === Classification ===
  discipline?: string;
  category?: string;
  areaOfFunction?: string;

  // === People ===
  initiator?: string;
  contractorClosedBy?: string;

  // === Dates (ISO 8601: YYYY-MM-DD) ===
  issuedDate?: string;
  receivedDate?: string;
  acd?: string;
  acdExtended?: string;
  responseDate?: string;
  closingDate?: string;

  // === Status & Risk ===
  status: RecordStatus;
  repeatViolation: boolean;
  escalatedToSANCR: boolean;

  // === Response & Resolution ===
  responseAction?: string;

  // === INCR-Specific Fields ===
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

  // === Metadata ===
  remark?: string;
}

// ─── Computed Risk Fields ────────────────────────────────────────────────────

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

// ─── Per-File Parsing Configuration ──────────────────────────────────────────

export interface FileParsingConfig {
  fileName: string;
  sheetName: string;
  headerRow: number; // 0-indexed
  recordType: RecordType;
  project: string;
  location: string;
  contractNumber?: string;
  columnMapping: Record<string, string>; // source col name → QualityRecord field
}

// ─── API Response Types ──────────────────────────────────────────────────────

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

// ─── Dashboard Summary ──────────────────────────────────────────────────────

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
