/**
 * Data Normalizer — transforms raw Excel rows into QualityRecord objects.
 *
 * Responsibilities:
 *  - Map source column names to QualityRecord fields using FileParsingConfig
 *  - Normalize dates, booleans, statuses, categories
 *  - Derive titles for INCR records without a Title column
 *  - Generate unique IDs
 *  - Log (but don't crash on) malformed rows
 */

import { QualityRecord, FileParsingConfig } from '../types/quality';
import { ParsedSheet, RawRow } from './excelReader';
import {
  parseDate,
  parseBoolean,
  normalizeStatus,
  normalizeString,
  normalizeProject,
  normalizeLocation,
  normalizeDiscipline,
  normalizeCategory,
  deriveTitle,
} from '../utils/normalize';

// Fields that should be parsed as dates
const DATE_FIELDS = new Set([
  'issuedDate', 'receivedDate', 'acd', 'acdExtended',
  'responseDate', 'closingDate', 'ncrSubmittalDate',
  'rfiDateForClosingNcr', 'closedNcrSubmittalDate', 'ncrClosedDateByCompany',
]);

// Fields that should be parsed as booleans
const BOOLEAN_FIELDS = new Set(['repeatViolation', 'escalatedToSANCR']);

// Fields to skip (internal markers, not real QualityRecord fields)
const SKIP_FIELDS = new Set(['_project', '_location']);

interface NormalizationResult {
  records: QualityRecord[];
  errors: Array<{
    file: string;
    row: number;
    field?: string;
    message: string;
    rawValue?: unknown;
  }>;
}

/**
 * Normalize a single raw row into a QualityRecord.
 * Returns null if the row is fundamentally unusable.
 */
function normalizeRow(
  raw: RawRow,
  rowIndex: number,
  config: FileParsingConfig
): { record: QualityRecord | null; errors: string[] } {
  const errors: string[] = [];
  const mapped: Record<string, unknown> = {};

  // Step 1: Map source columns → QualityRecord field names
  for (const [sourceCol, targetField] of Object.entries(config.columnMapping)) {
    if (SKIP_FIELDS.has(targetField)) continue;

    const rawValue = raw[sourceCol];
    if (rawValue === null || rawValue === undefined) continue;

    mapped[targetField] = rawValue;
  }

  // Step 2: Extract and validate critical fields

  // Serial number
  const serialRaw = mapped['serialNumber'];
  let serialNumber = serialRaw !== undefined && serialRaw !== null && String(serialRaw).trim() !== '' ? Number(serialRaw) : NaN;
  if (isNaN(serialNumber)) {
    // Fallback to row index if missing to ensure we still parse valid data rows
    serialNumber = rowIndex + 10000;
  }

  // Reference number
  const referenceNumber = normalizeString(mapped['referenceNumber']);
  if (!referenceNumber) {
    errors.push(`Missing reference number for serial ${serialNumber}`);
    // Generate a fallback
  }

  // Generate unique ID
  const projectSlug = config.project.toLowerCase().replace(/[^a-z0-9]/g, '');
  const typeSlug = config.recordType.toLowerCase();
  const refSlug = referenceNumber
    ? referenceNumber.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
    : String(serialNumber);
  const id = `${projectSlug}-${typeSlug}-${refSlug}`;

  // Step 3: Build the QualityRecord with normalization

  // Status
  const status = normalizeStatus(mapped['status']);

  // Notification Title / Subject
  let notificationTitle = normalizeString(mapped['notificationTitle']) ?? '';
  const subject = normalizeString(mapped['subject']) ?? '';

  // For INCR records without a Title column, derive from subject
  if (!notificationTitle && config.recordType === 'INCR' && subject) {
    notificationTitle = deriveTitle(subject);
  }

  if (!notificationTitle && !subject) {
    errors.push(`Row ${serialNumber}: Both notificationTitle and subject are empty`);
  }

  // Dates
  const dateFields: Record<string, string | undefined> = {};
  for (const field of DATE_FIELDS) {
    const rawVal = mapped[field];
    if (rawVal !== undefined) {
      try {
        dateFields[field] = parseDate(rawVal) ?? undefined;
      } catch (e) {
        errors.push(`Row ${serialNumber}: Failed to parse date field "${field}": ${JSON.stringify(rawVal)}`);
        dateFields[field] = undefined;
      }
    }
  }

  // Booleans
  const repeatViolation = parseBoolean(mapped['repeatViolation']);
  const escalatedToSANCR = parseBoolean(mapped['escalatedToSANCR']);

  // Build the record
  const record: QualityRecord = {
    id,
    sourceFile: config.fileName,
    recordType: config.recordType,
    serialNumber,
    referenceNumber: referenceNumber ?? `${config.recordType}-${serialNumber}`,

    project: normalizeProject(
      raw[Object.keys(config.columnMapping).find(k => config.columnMapping[k] === '_project') ?? ''],
      config.project
    ),
    location: normalizeLocation(
      raw[Object.keys(config.columnMapping).find(k => config.columnMapping[k] === '_location') ?? ''],
      config.location
    ),
    contractNumber: config.contractNumber,

    notificationTitle: notificationTitle || 'Untitled',
    subject: subject || notificationTitle || 'No description provided',

    discipline: normalizeDiscipline(mapped['discipline']),
    category: normalizeCategory(mapped['category']),
    areaOfFunction: normalizeString(mapped['areaOfFunction']),

    initiator: normalizeString(mapped['initiator']),
    contractorClosedBy: normalizeString(mapped['contractorClosedBy']),

    issuedDate: dateFields['issuedDate'],
    receivedDate: dateFields['receivedDate'],
    acd: dateFields['acd'],
    acdExtended: dateFields['acdExtended'],
    responseDate: dateFields['responseDate'],
    closingDate: dateFields['closingDate'] ?? dateFields['ncrClosedDateByCompany'],

    status,
    repeatViolation,
    escalatedToSANCR,

    responseAction: normalizeString(mapped['responseAction']),

    // INCR-specific fields
    ncrSubmittalDate: dateFields['ncrSubmittalDate'],
    referenceDocument: normalizeString(mapped['referenceDocument']),
    failureAndEvidence: normalizeString(mapped['failureAndEvidence']),
    rootCause: normalizeString(mapped['rootCause']),
    correctionProposed: normalizeString(mapped['correctionProposed']),
    correctiveAction: normalizeString(mapped['correctiveAction']),
    preventiveAction: normalizeString(mapped['preventiveAction']),
    verificationOfEffectiveness: normalizeString(mapped['verificationOfEffectiveness']),
    rfiDateForClosingNcr: dateFields['rfiDateForClosingNcr'],
    closedNcrSubmittalDate: dateFields['closedNcrSubmittalDate'],
    ncrClosedDateByCompany: dateFields['ncrClosedDateByCompany'],
    riskAndOpportunity: normalizeString(mapped['riskAndOpportunity']),
    typeOfViolation: normalizeString(mapped['typeOfViolation']),

    remark: normalizeString(mapped['remark']),
  };

  return { record, errors };
}

/**
 * Normalize all parsed sheets into QualityRecords.
 */
export function normalizeAllSheets(parsedSheets: ParsedSheet[]): NormalizationResult {
  const allRecords: QualityRecord[] = [];
  const allErrors: NormalizationResult['errors'] = [];

  for (const sheet of parsedSheets) {
    // Skip sheets with fatal parse errors
    if (sheet.rows.length === 0 && sheet.errors.length > 0) {
      for (const err of sheet.errors) {
        allErrors.push({ file: sheet.config.fileName, row: -1, message: err });
      }
      continue;
    }

    for (let i = 0; i < sheet.rows.length; i++) {
      const raw = sheet.rows[i];
      try {
        const { record, errors } = normalizeRow(raw, i, sheet.config);

        for (const err of errors) {
          allErrors.push({
            file: sheet.config.fileName,
            row: i + sheet.config.headerRow + 1,
            message: err,
          });
        }

        if (record) {
          allRecords.push(record);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        allErrors.push({
          file: sheet.config.fileName,
          row: i + sheet.config.headerRow + 1,
          message: `Unexpected error normalizing row: ${msg}`,
        });
        // Never crash on a single malformed row
      }
    }
  }

  // Log summary
  const totalErrors = allErrors.length;
  if (totalErrors > 0) {
    console.warn(`[DataNormalizer] ${totalErrors} warning(s) during normalization:`);
    for (const err of allErrors.slice(0, 20)) {
      console.warn(`  ⚠ ${err.file} row ${err.row}: ${err.message}`);
    }
    if (totalErrors > 20) {
      console.warn(`  ... and ${totalErrors - 20} more`);
    }
  }

  console.log(`[DataNormalizer] Normalized ${allRecords.length} records total`);

  return { records: allRecords, errors: allErrors };
}
