# Data Mapping — Normalization to Common Application Data Model

> Maps the four different Excel file structures into a unified data model for the Quality Risk & Notification Dashboard.

---

## 1. Unified Record Type: `QualityRecord`

Both INCR and LBE records will be normalized into a single `QualityRecord` type with a `recordType` discriminator.

```typescript
interface QualityRecord {
  // === Identity ===
  id: string;                        // Generated unique ID (e.g., "dorra-lbe-33", "crpo160-incr-023")
  recordType: 'LBE' | 'INCR';       // Letter Before Escalation or Internal NCR
  sourceFile: string;                // Original file name
  serialNumber: number;              // Sl No. (LBE) or SN (INCR)
  referenceNumber: string;           // LBE No. (LBE) or NCR No. (INCR)

  // === Project Context ===
  project: string;                   // "Dorra" or "CRPO-160"
  location: string;                  // "Hazira" (normalized to title case)
  contractNumber?: string;           // Extracted from sheet subtitle

  // === Problem Description (Primary Fields) ===
  notificationTitle: string;         // The concise problem title
  subject: string;                   // Detailed problem narrative/description

  // === Classification ===
  discipline: string;                // "Structure", "Mechanical", "Coating", "Electrical"
  category: string | null;           // "Minor", "Moderate" — normalized from typo variants
  areaOfFunction: string | null;     // "Construction", "Design & Engineering" (INCR only)

  // === People ===
  initiator: string | null;          // Person who initiated/reported
  contractorClosedBy: string | null; // Person who closed on contractor side

  // === Dates ===
  issuedDate: string | null;         // ISO 8601 (YYYY-MM-DD)
  receivedDate: string | null;       // ISO 8601
  acd: string | null;                // Anticipated Completion Date — ISO 8601
  acdExtended: string | null;        // Extended ACD — ISO 8601
  responseDate: string | null;       // ISO 8601 (first date if multi-value)
  closingDate: string | null;        // ISO 8601

  // === Status & Risk ===
  status: 'Open' | 'Closed' | 'Withdrawn';
  repeatViolation: boolean;          // Normalized from "Yes"/"No" string
  escalatedToSaNcr: boolean;         // Normalized from string or empty

  // === Response & Resolution ===
  responseActionTaken: string | null;  // Combined response text

  // === INCR-Specific Fields (null for LBE records) ===
  ncrSubmittalDate: string | null;
  referenceDocument: string | null;
  failureAndEvidence: string | null;
  rootCause: string | null;
  correctionProposed: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  verificationOfEffectiveness: string | null;
  rfiDateForClosingNcr: string | null;
  closedNcrSubmittalDate: string | null;
  ncrClosedDateByCompany: string | null;
  riskAndOpportunity: string | null;
  typeOfViolation: string | null;

  // === Metadata ===
  remark: string | null;
}
```

---

## 2. Column Mapping Tables

### 2.1 LBE Files → QualityRecord

| QualityRecord Field | Dorra LBE Column | CRPO-160 LBE Column | Transform |
|---------------------|-------------------|----------------------|-----------|
| `id` | — | — | Generate: `{project}-lbe-{lbeNo}` |
| `recordType` | — | — | `"LBE"` (constant) |
| `sourceFile` | — | — | File name |
| `serialNumber` | `Sl No.` | `Sl No.` | Parse to number |
| `referenceNumber` | `LBE No.` | `LBE No.` | String |
| `project` | `Project` | `Project` | Normalize: "Dorra", "CRPO-160" |
| `location` | `Location` | `Location` | Title case: "Hazira" |
| `notificationTitle` | `Notification Title` | `Notification Title` | Trim |
| `subject` | `Subject` | `Subject` | Trim, preserve newlines |
| `discipline` | `Discipline` | `Discipline` | Trim |
| `category` | `Catrgory` ⚠️ | *(missing)* | Normalize: "Minor"/"Moderate"; default `null` if missing |
| `areaOfFunction` | — | — | `null` (LBE doesn't have this) |
| `initiator` | `Initiator` | `Initiator` | Trim |
| `contractorClosedBy` | `Contractor Closed by Initial` | `Contractor Closed by Initial` | Trim |
| `issuedDate` | `Issued Date` | `Issued Date` | Excel serial → ISO 8601 |
| `receivedDate` | `Recived Date` ⚠️ | *(missing)* | Excel serial → ISO 8601; `null` if missing |
| `acd` | `ACD` | `ACD` | Excel serial → ISO 8601 |
| `acdExtended` | `ACD Extended` | `ACD Extended` | Excel serial → ISO 8601 |
| `responseDate` | `Response Date` | `Response Date` | See Date Transform Rules |
| `closingDate` | `Closing Date` | `Closing Date` | Excel serial → ISO 8601 |
| `status` | `Status` | `Status` | Normalize enum |
| `repeatViolation` | `Repeat Violation` | `Repeat Violation` | "Yes" → `true`, else `false` |
| `escalatedToSaNcr` | `Escalated to SA NCR` | `Escalated to SA NCR` | Non-empty → `true`, else `false` |
| `responseActionTaken` | `SAPMT/Contractor Response / Action Taken` | `SAPMT/Contractor Response / Action Taken` | Trim |
| `remark` | `Remark` | `Remark` | Trim |
| *(INCR fields)* | — | — | All `null` |

### 2.2 INCR Files → QualityRecord

| QualityRecord Field | Dorra INCR Column | CRPO-160 INCR Column | Transform |
|---------------------|--------------------|-----------------------|-----------|
| `id` | — | — | Generate: `{project}-incr-{ncrNo}` |
| `recordType` | — | — | `"INCR"` (constant) |
| `sourceFile` | — | — | File name |
| `serialNumber` | `SN` | `SN` | Parse to number |
| `referenceNumber` | `NCR No.` | `NCR No.` | String |
| `project` | *(from filename)* | *(from filename)* | "Dorra" or "CRPO-160" |
| `location` | *(from filename/context)* | *(from filename)* | "Hazira" |
| `notificationTitle` | *(derived — see below)* | `Title` | See Title Derivation |
| `subject` | `Description of Non-Conformance` | `Description of Non-Conformance` | Trim |
| `discipline` | `Discipline` | `Discipline` | Trim, normalize whitespace |
| `category` | `NCR Catogory` ⚠️ | `NCR Catogory` ⚠️ | Normalize: "Minor"/"Moderate" |
| `areaOfFunction` | `Area of Function` | `Area of Function` | Trim |
| `initiator` | *(not available)* | `Initiated by` | Trim |
| `contractorClosedBy` | — | — | `null` |
| `issuedDate` | `Issue Date` | `Issue Date` | Excel serial → ISO 8601 |
| `receivedDate` | — | — | `null` |
| `acd` | `ACD` | `ACD` | Excel serial → ISO 8601 |
| `acdExtended` | — | `Extend ACD` | Excel serial → ISO 8601 |
| `responseDate` | — | — | `null` |
| `closingDate` | `NCR closed date by COMPANY` | `NCR closed date by COMPANY` | Excel serial → ISO 8601 |
| `status` | `NCR Status` | `NCR Status` | Normalize: same enum as LBE |
| `repeatViolation` | `Repeated Yes / No` | `Repeated Yes / No` | "Yes" → `true`, else `false` |
| `escalatedToSaNcr` | — | — | `false` (column doesn't exist) |
| `responseActionTaken` | — | — | `null` (INCR uses structured fields) |
| `ncrSubmittalDate` | `NCR Submittal Date` | `NCR Submittal Date` | Excel serial → ISO 8601 |
| `referenceDocument` | — | `Reference Document` | Trim |
| `failureAndEvidence` | `Failure & Evidence` | `Failure & Evidence` | Trim |
| `rootCause` | `Root Cause` | `Root Cause` | Trim |
| `correctionProposed` | `Correction Proposed` | `Correction Proposed` | Trim |
| `correctiveAction` | `Corrective Action/Preventive Action Proposed` | `Corrective Action / Preventive Action Proposed` | Trim |
| `preventiveAction` | `Preventive Action Proposed` | — | Trim |
| `verificationOfEffectiveness` | `Verification of Correction and Corrective/Preventive Action` | `Verification of Effectiveness of Correction & Corrective Action` | Trim |
| `rfiDateForClosingNcr` | `RFI date for closing NCR` | `RFI date for closing NCR` | Excel serial → ISO 8601 |
| `closedNcrSubmittalDate` | `Closed NCR Submittal Date` | `Closed NCR Submittal Date` | Excel serial → ISO 8601 |
| `ncrClosedDateByCompany` | `NCR closed date by COMPANY` | `NCR closed date by COMPANY` | Excel serial → ISO 8601 |
| `riskAndOpportunity` | — | `Risk and Opportunity` | Trim |
| `typeOfViolation` | — | `Type of Violation` | Trim |
| `remark` | `Remarks` | `Remarks` | Trim |

---

## 3. Transform Rules

### 3.1 Date Transforms

```
Rule 1: Excel Serial Number → ISO 8601
  Input:  46207 (number or numeric string)
  Output: "2026-07-04"
  Note:   Must account for Lotus 1-2-3 leap year bug (serials > 60 off by 1)
  Formula: For serial > 60: Date.UTC(1900, 0, 1) + (serial - 2) * 86400000
           For serial <= 60: Date.UTC(1900, 0, 1) + (serial - 1) * 86400000

Rule 2: DD-MM-YYYY String → ISO 8601
  Input:  "16-07-2026"
  Output: "2026-07-16"
  Regex:  /^(\d{2})-(\d{2})-(\d{4})$/

Rule 3: Multi-value Dates → First Date
  Input:  "16-07-2026,\r\n29-07-2026"
  Output: "2026-07-16" (use first date)
  Note:   Store full string in a separate field if needed

Rule 4: MM/DD/YY String → ISO 8601
  Input:  "7/31/26"
  Output: "2026-07-31"

Rule 5: Empty/null → null
```

### 3.2 Title Derivation for Dorra INCR

The Dorra INCR file has **no `Title` column**. The `notificationTitle` must be derived:

```
Strategy: Extract first sentence from "Description of Non-Conformance"
  - Truncate at first period (.) or 120 characters, whichever comes first
  - If the description starts with a date/location preamble ("On DD-MMM-YYYY, during..."),
    extract the key finding after the preamble
  
Example:
  Input:  "On 13-Jul-2026, during Fit-up inspection against Fit-up Request No.: 
           DORRA-JACKET-W2-FTU-438 (Joint No: T36 & T37), it was observed..."
  Output: "Fit-up inspection non-conformance — Joint T36 & T37"
```

**Alternative approach**: Use the full `Description of Non-Conformance` text as `subject` AND derive a short title automatically:
1. If description starts with surveillance/inspection context → extract the key finding
2. Otherwise → use first 120 characters + "..."

### 3.3 Status Normalization

```
"Closed"    → "Closed"
"Open"      → "Open"  
"Withdrawn" → "Withdrawn"
(case-insensitive, trimmed)
```

### 3.4 Boolean Normalization

```
"Yes" → true
"No"  → false
""    → false
null  → false
```

### 3.5 Project Name Normalization

```
"Dorra"   → "Dorra"
"CRPO160" → "CRPO-160"
"CRPO-160"→ "CRPO-160"
```

### 3.6 Location Normalization

```
"Hazira"  → "Hazira"
"HAZIRA"  → "Hazira"
```

### 3.7 Discipline Normalization

```
" Mechanical "  → "Mechanical"     (trim whitespace)
"Structure"     → "Structure"
"Coating"       → "Coating"
"Electrical"    → "Electrical"
```

---

## 4. File-Specific Parsing Configuration

```typescript
interface FileConfig {
  fileName: string;
  sheetName: string;
  headerRow: number;       // 0-indexed row number of the header
  recordType: 'LBE' | 'INCR';
  project: string;
  location: string;
  contractNumber?: string;
  columnMapping: Record<string, string>;  // source column → QualityRecord field
}

const FILE_CONFIGS: FileConfig[] = [
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
      'Notification Title': 'notificationTitle',
      'Subject': 'subject',
      'Discipline': 'discipline',
      'Catrgory': 'category',
      'Initiator': 'initiator',
      'Issued Date': 'issuedDate',
      'Recived Date': 'receivedDate',
      'ACD': 'acd',
      'ACD Extended': 'acdExtended',
      'Response Date': 'responseDate',
      'Closing Date': 'closingDate',
      'Status': 'status',
      'Repeat Violation': 'repeatViolation',
      'Escalated to SA NCR': 'escalatedToSaNcr',
      'SAPMT/Contractor Response / Action Taken': 'responseActionTaken',
      'Contractor Closed by Initial': 'contractorClosedBy',
      'Remark': 'remark',
    },
  },
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
      'Notification Title': 'notificationTitle',
      'Subject': 'subject',
      'Discipline': 'discipline',
      'Initiator': 'initiator',
      'Issued Date': 'issuedDate',
      'ACD': 'acd',
      'ACD Extended': 'acdExtended',
      'Response Date': 'responseDate',
      'Closing Date': 'closingDate',
      'Status': 'status',
      'Repeat Violation': 'repeatViolation',
      'Escalated to SA NCR': 'escalatedToSaNcr',
      'SAPMT/Contractor Response / Action Taken': 'responseActionTaken',
      'Contractor Closed by Initial': 'contractorClosedBy',
      'Remark': 'remark',
    },
  },
  {
    fileName: 'Dorra INCR LOG.xlsx',
    sheetName: 'NCR Register',
    headerRow: 11,
    recordType: 'INCR',
    project: 'Dorra',
    location: 'Hazira',
    columnMapping: {
      'SN': 'serialNumber',
      'NCR No.': 'referenceNumber',
      'Issue Date': 'issuedDate',
      'NCR Catogory': 'category',
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
      'NCR Catogory': 'category',
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
```

---

## 5. Data Pipeline Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Excel File  │────▶│  File Config  │────▶│  Parse & Map     │────▶│ QualityRecord│
│  (or Google  │     │  (header row, │     │  (normalize      │     │  (unified    │
│   Sheets)    │     │   col mapping)│     │   dates, enums,  │     │   TypeScript │
│              │     │               │     │   booleans)      │     │   objects)   │
└──────────────┘     └───────────────┘     └──────────────────┘     └──────┬──────┘
                                                                          │
                                                                          ▼
                                                                   ┌─────────────┐
                                                                   │  REST API   │
                                                                   │  /api/      │
                                                                   │  records    │
                                                                   └──────┬──────┘
                                                                          │
                                                                          ▼
                                                                   ┌─────────────┐
                                                                   │  Dashboard  │
                                                                   │  Frontend   │
                                                                   └─────────────┘
```

### Adapter Pattern for Future Google Sheets

```typescript
interface DataSource {
  loadRecords(): Promise<QualityRecord[]>;
}

class ExcelDataSource implements DataSource {
  // Current implementation — reads from .xlsx files
}

class GoogleSheetsDataSource implements DataSource {
  // Future implementation — reads from Google Sheets API
  // Uses the same FileConfig structure
  // Same column mappings, same normalization
}
```

---

## 6. Computed / Derived Fields for Risk Analysis

These fields are **not stored in Excel** but will be computed at load time:

```typescript
interface ComputedRiskFields {
  isOverdue: boolean;             // ACD < today AND status === "Open"
  daysOverdue: number | null;     // Days past ACD (if overdue)
  daysToResolve: number | null;   // closingDate - issuedDate (if closed)
  responseTimeDays: number | null; // responseDate - issuedDate
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  riskFactors: string[];          // List of applicable risk factors
}
```

### Risk Level Calculation:

```
Critical:
  - repeatViolation === true AND status === "Open"
  - escalatedToSaNcr === true
  
High:
  - repeatViolation === true (even if closed)
  - isOverdue === true AND daysOverdue > 14
  - category === "Moderate" AND status === "Open"

Medium:
  - isOverdue === true AND daysOverdue <= 14
  - status === "Open" (any open item)
  - category === "Moderate"

Low:
  - status === "Closed" AND repeatViolation === false
  - status === "Withdrawn"
```

---

## 7. Handling Edge Cases

| Edge Case | Strategy |
|-----------|----------|
| Missing `Title` in Dorra INCR | Derive from first 120 chars of `Description of Non-Conformance`, trimming date preambles |
| Missing `Category` in CRPO-160 LBE | Set to `null` — dashboard shows "Uncategorized" |
| Missing `Received Date` in CRPO-160 LBE | Set to `null` |
| Multi-value `Response Date` | Parse first date; store raw string in `responseActionTaken` metadata |
| Mixed date formats in same column | Try Excel serial first, then DD-MM-YYYY, then MM/DD/YY |
| Whitespace in `Discipline` (" Mechanical ") | Trim all string fields |
| `Closed` INCR records missing `closingDate` | Use `NCR closed date by COMPANY` as fallback |
| `Withdrawn` status | Treat as resolved/closed for risk calculations |
| Same `Notification Title` across records | Detect as potential recurring problem pattern |
