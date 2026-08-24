"use strict";
/**
 * File parsing configurations for each known Excel file.
 *
 * Each config tells the parser:
 *  - Which sheet to read
 *  - Which row contains headers (0-indexed)
 *  - How to map source column names → QualityRecord fields
 *  - Project/location metadata not present in the data rows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_CONFIGS = void 0;
exports.findConfigForFile = findConfigForFile;
exports.FILE_CONFIGS = [
    // ─── Dorra LBE ──────────────────────────────────────────────────────────
    {
        fileName: 'Dorra LBE LOG.xlsx',
        sheetName: 'Standard Violation',
        headerRow: 2,
        recordType: 'LBE',
        project: 'Dorra',
        location: 'Hazira',
        contractNumber: 'HQ002DP24',
        columnMapping: {
            'Sl No.': 'serialNumber',
            'LBE No.': 'referenceNumber',
            'Project': '_project',
            'Location': '_location',
            'Initiator': 'initiator',
            'Issued Date': 'issuedDate',
            'Recived Date': 'receivedDate', // typo in source
            'Notification Title': 'notificationTitle',
            'Discipline': 'discipline',
            'Subject': 'subject',
            'ACD': 'acd',
            'SAPMT/Contractor Response / Action Taken': 'responseAction',
            'Response Date': 'responseDate',
            'ACD Extended': 'acdExtended',
            'Status': 'status',
            'Closing Date': 'closingDate',
            'Contractor Closed by Initial': 'contractorClosedBy',
            'Repeat Violation': 'repeatViolation',
            'Catrgory': 'category', // typo in source
            'Escalated to SA NCR': 'escalatedToSANCR',
            'Remark': 'remark',
        },
    },
    // ─── CRPO-160 LBE ───────────────────────────────────────────────────────
    {
        fileName: 'CRPO-160-LBE LOG.xlsx',
        sheetName: 'Standard Violation',
        headerRow: 2,
        recordType: 'LBE',
        project: 'CRPO-160',
        location: 'Hazira',
        columnMapping: {
            'Sl No.': 'serialNumber',
            'LBE No.': 'referenceNumber',
            'Project': '_project',
            'Location': '_location',
            'Initiator': 'initiator',
            'Issued Date': 'issuedDate',
            // Note: No 'Recived Date' column in this file
            'Notification Title': 'notificationTitle',
            'Discipline': 'discipline',
            'Subject': 'subject',
            'ACD': 'acd',
            'SAPMT/Contractor Response / Action Taken': 'responseAction',
            'Response Date': 'responseDate',
            'ACD Extended': 'acdExtended',
            'Status': 'status',
            'Closing Date': 'closingDate',
            'Contractor Closed by Initial': 'contractorClosedBy',
            'Repeat Violation': 'repeatViolation',
            // Note: No 'Catrgory' column in this file
            'Escalated to SA NCR': 'escalatedToSANCR',
            'Remark': 'remark',
        },
    },
    // ─── Dorra INCR ─────────────────────────────────────────────────────────
    {
        fileName: 'Dorra INCR LOG.xlsx',
        sheetName: 'NCR Register',
        headerRow: 11, // Data starts after summary table
        recordType: 'INCR',
        project: 'Dorra',
        location: 'Hazira',
        columnMapping: {
            'SN': 'serialNumber',
            'NCR No.': 'referenceNumber',
            'Issue Date': 'issuedDate',
            'NCR Catogory': 'category', // typo in source
            'NCR Submittal Date': 'ncrSubmittalDate',
            'Discipline': 'discipline',
            'Area of Function': 'areaOfFunction',
            'ACD': 'acd',
            'NCR Status': 'status',
            'Description of Non-Conformance': 'subject',
            'Failure & Evidence': 'failureAndEvidence',
            'Root Cause': 'rootCause',
            'Correction Proposed': 'correctionProposed',
            'Corrective Action/Preventive Action Proposed': 'correctiveAction',
            'Preventive Action Proposed': 'preventiveAction',
            'Verification of Correction and Corrective/Preventive Action': 'verificationOfEffectiveness',
            'RFI date for closing NCR': 'rfiDateForClosingNcr',
            'Closed NCR Submittal Date': 'closedNcrSubmittalDate',
            'NCR closed date by COMPANY': 'ncrClosedDateByCompany',
            'Repeated Yes / No': 'repeatViolation',
            'Remarks': 'remark',
        },
    },
    // ─── CRPO-160 INCR ──────────────────────────────────────────────────────
    {
        fileName: 'CRPO-160-INCR LOG - Hazira Yard.xlsx',
        sheetName: 'NCR Register',
        headerRow: 1,
        recordType: 'INCR',
        project: 'CRPO-160',
        location: 'Hazira',
        columnMapping: {
            'SN': 'serialNumber',
            'NCR No.': 'referenceNumber',
            'Issue Date': 'issuedDate',
            'NCR Catogory': 'category', // typo in source
            'NCR Submittal Date': 'ncrSubmittalDate',
            'Discipline': 'discipline',
            'Area of Function': 'areaOfFunction',
            'ACD': 'acd',
            'Extend ACD': 'acdExtended',
            'NCR Status': 'status',
            'Title': 'notificationTitle',
            'Description of Non-Conformance': 'subject',
            'Reference Document': 'referenceDocument',
            'Failure & Evidence': 'failureAndEvidence',
            'Root Cause': 'rootCause',
            'Correction Proposed': 'correctionProposed',
            'Corrective Action': 'correctiveAction',
            'Corrective Action / Preventive Action Proposed': 'preventiveAction',
            'Verification of Effectiveness of Correction & Corrective Action': 'verificationOfEffectiveness',
            'RFI date for closing NCR': 'rfiDateForClosingNcr',
            'Closed NCR Submittal Date': 'closedNcrSubmittalDate',
            'NCR closed date by COMPANY': 'ncrClosedDateByCompany',
            'Risk and Opportunity': 'riskAndOpportunity',
            'Repeated Yes / No': 'repeatViolation',
            'Remarks': 'remark',
            'Type of Violation': 'typeOfViolation',
            'Initiated by': 'initiator',
        },
    },
];
/**
 * Try to find a matching config for a given filename.
 * Falls back to null if no config is found.
 */
function findConfigForFile(fileName) {
    return exports.FILE_CONFIGS.find(c => c.fileName === fileName) ?? null;
}
//# sourceMappingURL=fileConfigs.js.map