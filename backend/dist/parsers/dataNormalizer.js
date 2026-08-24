"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAllSheets = normalizeAllSheets;
const normalize_1 = require("../utils/normalize");
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
/**
 * Normalize a single raw row into a QualityRecord.
 * Returns null if the row is fundamentally unusable.
 */
function normalizeRow(raw, rowIndex, config) {
    const errors = [];
    const mapped = {};
    // Step 1: Map source columns → QualityRecord field names
    for (const [sourceCol, targetField] of Object.entries(config.columnMapping)) {
        if (SKIP_FIELDS.has(targetField))
            continue;
        const rawValue = raw[sourceCol];
        if (rawValue === null || rawValue === undefined)
            continue;
        mapped[targetField] = rawValue;
    }
    // Step 2: Extract and validate critical fields
    // Serial number
    const serialRaw = mapped['serialNumber'];
    const serialNumber = serialRaw !== undefined ? Number(serialRaw) : NaN;
    if (isNaN(serialNumber)) {
        errors.push(`Invalid serial number: ${JSON.stringify(serialRaw)}`);
        return { record: null, errors };
    }
    // Reference number
    const referenceNumber = (0, normalize_1.normalizeString)(mapped['referenceNumber']);
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
    const status = (0, normalize_1.normalizeStatus)(mapped['status']);
    // Notification Title / Subject
    let notificationTitle = (0, normalize_1.normalizeString)(mapped['notificationTitle']) ?? '';
    const subject = (0, normalize_1.normalizeString)(mapped['subject']) ?? '';
    // For INCR records without a Title column, derive from subject
    if (!notificationTitle && config.recordType === 'INCR' && subject) {
        notificationTitle = (0, normalize_1.deriveTitle)(subject);
    }
    if (!notificationTitle && !subject) {
        errors.push(`Row ${serialNumber}: Both notificationTitle and subject are empty`);
    }
    // Dates
    const dateFields = {};
    for (const field of DATE_FIELDS) {
        const rawVal = mapped[field];
        if (rawVal !== undefined) {
            try {
                dateFields[field] = (0, normalize_1.parseDate)(rawVal) ?? undefined;
            }
            catch (e) {
                errors.push(`Row ${serialNumber}: Failed to parse date field "${field}": ${JSON.stringify(rawVal)}`);
                dateFields[field] = undefined;
            }
        }
    }
    // Booleans
    const repeatViolation = (0, normalize_1.parseBoolean)(mapped['repeatViolation']);
    const escalatedToSANCR = (0, normalize_1.parseBoolean)(mapped['escalatedToSANCR']);
    // Build the record
    const record = {
        id,
        sourceFile: config.fileName,
        recordType: config.recordType,
        serialNumber,
        referenceNumber: referenceNumber ?? `${config.recordType}-${serialNumber}`,
        project: (0, normalize_1.normalizeProject)(raw[Object.keys(config.columnMapping).find(k => config.columnMapping[k] === '_project') ?? ''], config.project),
        location: (0, normalize_1.normalizeLocation)(raw[Object.keys(config.columnMapping).find(k => config.columnMapping[k] === '_location') ?? ''], config.location),
        contractNumber: config.contractNumber,
        notificationTitle: notificationTitle || 'Untitled',
        subject: subject || notificationTitle || 'No description provided',
        discipline: (0, normalize_1.normalizeDiscipline)(mapped['discipline']),
        category: (0, normalize_1.normalizeCategory)(mapped['category']),
        areaOfFunction: (0, normalize_1.normalizeString)(mapped['areaOfFunction']),
        initiator: (0, normalize_1.normalizeString)(mapped['initiator']),
        contractorClosedBy: (0, normalize_1.normalizeString)(mapped['contractorClosedBy']),
        issuedDate: dateFields['issuedDate'],
        receivedDate: dateFields['receivedDate'],
        acd: dateFields['acd'],
        acdExtended: dateFields['acdExtended'],
        responseDate: dateFields['responseDate'],
        closingDate: dateFields['closingDate'] ?? dateFields['ncrClosedDateByCompany'],
        status,
        repeatViolation,
        escalatedToSANCR,
        responseAction: (0, normalize_1.normalizeString)(mapped['responseAction']),
        // INCR-specific fields
        ncrSubmittalDate: dateFields['ncrSubmittalDate'],
        referenceDocument: (0, normalize_1.normalizeString)(mapped['referenceDocument']),
        failureAndEvidence: (0, normalize_1.normalizeString)(mapped['failureAndEvidence']),
        rootCause: (0, normalize_1.normalizeString)(mapped['rootCause']),
        correctionProposed: (0, normalize_1.normalizeString)(mapped['correctionProposed']),
        correctiveAction: (0, normalize_1.normalizeString)(mapped['correctiveAction']),
        preventiveAction: (0, normalize_1.normalizeString)(mapped['preventiveAction']),
        verificationOfEffectiveness: (0, normalize_1.normalizeString)(mapped['verificationOfEffectiveness']),
        rfiDateForClosingNcr: dateFields['rfiDateForClosingNcr'],
        closedNcrSubmittalDate: dateFields['closedNcrSubmittalDate'],
        ncrClosedDateByCompany: dateFields['ncrClosedDateByCompany'],
        riskAndOpportunity: (0, normalize_1.normalizeString)(mapped['riskAndOpportunity']),
        typeOfViolation: (0, normalize_1.normalizeString)(mapped['typeOfViolation']),
        remark: (0, normalize_1.normalizeString)(mapped['remark']),
    };
    return { record, errors };
}
/**
 * Normalize all parsed sheets into QualityRecords.
 */
function normalizeAllSheets(parsedSheets) {
    const allRecords = [];
    const allErrors = [];
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
            }
            catch (e) {
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
//# sourceMappingURL=dataNormalizer.js.map