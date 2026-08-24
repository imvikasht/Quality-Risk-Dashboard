# Data Analysis Report

> Generated: 2026-08-15 | Quality Risk & Notification Dashboard  
> Validated: All column mappings and date conversions verified against source data.

---

## 1. File Inventory

| File | Size | Sheets | Record Type | Data Rows |
|------|------|--------|-------------|-----------|
| `Dorra INCR LOG.xlsx` | 92,978 B | `NCR Register` | INCR (Internal Non-Conformance Report) | 12 |
| `Dorra LBE LOG.xlsx` | 88,543 B | `Standard Violation` | LBE (Letter Before Escalation / Standard Violation) | 15 |
| `CRPO-160-INCR LOG - Hazira Yard.xlsx` | 109,821 B | `NCR Register` | INCR (Internal Non-Conformance Report) | 7 |
| `CRPO-160-LBE LOG.xlsx` | 51,386 B | `Standard Violation` | LBE (Letter Before Escalation / Standard Violation) | 3 |

**Total records: 37** (19 INCR + 18 LBE)

---

## 2. Record Types: INCR vs LBE

The two file types represent **fundamentally different quality record categories**:

### LBE — Letter Before Escalation (Standard Violation)
- **Purpose**: Documents standard violations observed during inspections/surveillance.
- **Severity**: Lower severity — a warning/notification before formal escalation.
- **Structure**: Simpler, notification-focused — records the violation, response, and closure.
- **Key field**: `Notification Title` — concise description of the violation.
- **Key field**: `Subject` — detailed narrative of the violation context.
- **Can be escalated**: Has `Escalated to SA NCR` column (but currently empty in all data).

### INCR — Internal Non-Conformance Report
- **Purpose**: Formal non-conformance reports requiring root cause analysis, corrective & preventive action.
- **Severity**: Higher severity — requires structured investigation and resolution.
- **Structure**: Much more detailed — includes Root Cause, Correction, Corrective/Preventive Actions, Verification of Effectiveness.
- **Key field**: `Title` (CRPO-160) or `Description of Non-Conformance` (Dorra) — describes the non-conformance.
- **Key field**: `Description of Non-Conformance` — detailed description of the non-conformance.

---

## 3. Sheet Structure Details

### 3.1 Dorra INCR LOG.xlsx → Sheet: "NCR Register"

**Structure:**
- **Rows 0–1**: Title rows (merged cells: "NON-CONFORMANCE REPORT (NCR) REGISTER", "PROJECT TITLE: DORRA GAS WELL HEAD PLATFORM JACKETS PROJECT")
- **Rows 2–9**: Summary statistics table (Issued/Closed/Open counts by discipline)
- **Row 10**: Empty separator
- **Row 11**: **Header row** (actual column headers)
- **Rows 12–23**: Data rows (12 records, SN 27–38)

**Columns (21):**

| Col | Header | Fill Rate | Type | Notes |
|-----|--------|-----------|------|-------|
| 0 | SN | 100% | Number | Sequential: 27–38 |
| 1 | NCR No. | 100% | String | Format: `DORRA-PKG1-INCR-0XX` |
| 2 | Issue Date | 100% | Excel Serial | All July–Aug 2026 |
| 3 | NCR Catogory | 100% | Enum | All "Minor" |
| 4 | NCR Submittal Date | 100% | Excel Serial | |
| 5 | Discipline | 100% | Enum | "Structure", "Mechanical" |
| 6 | Area of Function | 100% | Enum | "Construction", "Design & Engineering" |
| 7 | ACD | 100% | Excel Serial | Anticipated Completion Date |
| 8 | NCR Status | 100% | Enum | "Closed", "Open" |
| 9 | Description of Non-Conformance | 100% | Long Text | **Primary problem description** |
| 10 | Failure & Evidence | 92% | Long Text | |
| 11 | Root Cause | 92% | Long Text | |
| 12 | Correction Proposed | 100% | Long Text | |
| 13 | Corrective Action/Preventive Action Proposed | 100% | Long Text | |
| 14 | Preventive Action Proposed | 0% | - | **Always empty** |
| 15 | Verification of Correction and Corrective/Preventive Action | 42% | Long Text | |
| 16 | RFI date for closing NCR | 42% | Excel Serial | |
| 17 | Closed NCR Submittal Date | 42% | Excel Serial | |
| 18 | NCR closed date by COMPANY | 42% | Excel Serial | |
| 19 | Repeated Yes / No | 100% | Enum | All "No" |
| 20 | Remarks | 0% | - | **Always empty** |

**Notable**: No separate "Title" column — the `Description of Non-Conformance` serves as the problem description.

---

### 3.2 CRPO-160-INCR LOG - Hazira Yard.xlsx → Sheet: "NCR Register"

**Structure:**
- **Row 0**: Title row (merged: "NON-CONFORMANCE REPORT (NCR) REGISTER")
- **Row 1**: **Header row** (actual column headers)
- **Rows 2–8**: Data rows (7 records, SN 23–29)

**Columns (30):**

| Col | Header | Fill Rate | Type | Notes |
|-----|--------|-----------|------|-------|
| 0 | SN | 100% | Number | Sequential: 23–29 |
| 1 | NCR No. | 100% | String | Format: `CRPO160-NCR-0XX` |
| 2 | Issue Date | 100% | Excel Serial | |
| 3 | NCR Catogory | 100% | Enum | All "Minor" |
| 4 | NCR Submittal Date | 100% | Excel Serial | |
| 5 | Discipline | 100% | Enum | "Structure", "Electrical" |
| 6 | Area of Function | 0% | - | **Empty** (unlike Dorra) |
| 8 | PO No. | 0% | - | **Always empty** |
| 9 | Lot No. | 0% | - | **Always empty** |
| 10 | ACD | 100% | Excel Serial | |
| 11 | Extend ACD | 0% | - | **Always empty** |
| 12 | NCR Status | 100% | Enum | "Closed", "Open" |
| 13 | Title | 100% | String | **Short problem title** (unique to this file) |
| 14 | Description of Non-Conformance | 100% | Long Text | |
| 15 | Reference Document | 100% | String | |
| 16 | Failure & Evidence | 100% | Long Text | |
| 17 | Root Cause | 100% | Long Text | |
| 18 | Correction Proposed | 100% | Long Text | |
| 19 | Corrective Action | 14% | Long Text | |
| 20 | Corrective Action / Preventive Action Proposed | 100% | Long Text | |
| 21 | Verification of Effectiveness of Correction & Corrective Action | 43% | Long Text | |
| 22 | RFI date for closing NCR | 43% | Excel Serial | |
| 23 | Closed NCR Submittal Date | 43% | Excel Serial | |
| 24 | NCR closed date by COMPANY | 43% | Excel Serial | |
| 25 | Risk and Opportunity | 0% | - | **Always empty** |
| 26 | Necessity to change in QMS | 0% | - | **Always empty** |
| 27 | Repeated Yes / No | 100% | Enum | All "No" |
| 28 | Remarks | 0% | - | **Always empty** |
| 29 | Type of Violation | 0% | - | **Always empty** |
| 30 | Initiated by | 100% | String | Person names |

**Notable**: Has a `Title` column (short title) AND `Description of Non-Conformance` (long text). Also has extra columns like `PO No.`, `Lot No.`, `Risk and Opportunity`, `Necessity to change in QMS`, `Type of Violation`, and `Initiated by` not present in Dorra INCR.

---

### 3.3 Dorra LBE LOG.xlsx → Sheet: "Standard Violation"

**Structure:**
- **Row 0**: Project title (merged: "DORRA GAS WELL HEAD PLATFORM JACKETS PROJECT")
- **Row 1**: Subtitle (merged: "Company LBE Log/Register (Standard Violation) CONTRACT NO. HQ002DP24")
- **Row 2**: **Header row** (actual column headers)
- **Rows 3–17**: Data rows (15 records, Sl No. 33–47)

**Columns (21):**

| Col | Header | Fill Rate | Type | Notes |
|-----|--------|-----------|------|-------|
| 0 | Sl No. | 100% | Number | Sequential: 33–47 |
| 1 | LBE No. | 100% | Number | Matches Sl No. |
| 2 | Project | 100% | Enum | All "Dorra" |
| 3 | Location | 100% | Enum | All "Hazira" |
| 4 | Initiator | 100% | String | 6 unique initiators |
| 5 | Issued Date | 100% | Excel Serial | July–Aug 2026 |
| 6 | Recived Date | 100% | Excel Serial | Note: **typo "Recived"** |
| 7 | Notification Title | 100% | String | **Primary problem description** |
| 8 | Discipline | 100% | Enum | "Mechanical", "Coating" |
| 9 | Subject | 100% | Long Text | **Detailed problem narrative** |
| 10 | ACD | 100% | Excel Serial | |
| 11 | SAPMT/Contractor Response / Action Taken | 100% | Long Text | |
| 12 | Response Date | 100% | Excel Serial | |
| 13 | ACD Extended | 0% | - | **Always empty** |
| 14 | Status | 100% | Enum | "Closed", "Withdrawn", "Open" |
| 15 | Closing Date | 73% | Excel Serial | |
| 16 | Contractor Closed by Initial | 100% | String | Person name |
| 17 | Repeat Violation | 100% | Enum | "No", "Yes" |
| 18 | Catrgory | 100% | Enum | "Minor", "Moderate" (typo: **"Catrgory"**) |
| 19 | Escalated to SA NCR | 0% | - | **Always empty** |
| 20 | Remark | 0% | - | **Always empty** |

---

### 3.4 CRPO-160-LBE LOG.xlsx → Sheet: "Standard Violation"

**Structure:**
- **Row 0**: Project title (merged)
- **Row 1**: Subtitle (merged)
- **Row 2**: **Header row**
- **Rows 3–5**: Data rows (3 records, Sl No. 8–10)

**Columns (19):** Same as Dorra LBE except:
- **Missing**: `Recived Date` (no Received Date column)
- **Missing**: `Catrgory` (no Category column)
- Project: All "CRPO160"
- Location: All "HAZIRA"

**Special note on Response Date**: CRPO-160 LBE has multi-value response dates in some cells:
- `"16-07-2026,\r\n29-07-2026"` — contains **DD-MM-YYYY** string format instead of Excel serial numbers
- `"46234"` — uses Excel serial number

This is a **mixed date format** within the same column.

---

## 4. Date Formats

### Primary format: Excel Serial Numbers
Most dates are stored as **Excel serial numbers** (integer). Conversion accounts for the Lotus 1-2-3 leap year bug (serials > 60 are off by 1):
- `46205` → 2026-07-02
- `46207` → 2026-07-04
- `46212` → 2026-07-09
- `46244` → 2026-08-10

All dates fall within **July–August 2026**.

### Secondary format: DD-MM-YYYY strings
Found in CRPO-160 LBE LOG `Response Date` column:
- `"16-07-2026,\r\n29-07-2026"` — multiple dates separated by comma + newline
- `"20-07-2026,\r\n31-07-2026"` — multiple dates separated by comma + newline

### Mixed format
The CRPO-160 LBE `Response Date` column contains both serial numbers AND date strings. The application parser must handle both.

---

## 5. Categorical Value Analysis

### 5.1 Status / NCR Status

| Value | Appears In | Meaning |
|-------|-----------|---------|
| `Closed` | All files | Issue resolved and closed |
| `Open` | All files | Issue still active |
| `Withdrawn` | Dorra LBE only | Issue retracted/cancelled |

### 5.2 Category / NCR Catogory

| Value | Appears In | Count |
|-------|-----------|-------|
| `Minor` | All files | Majority |
| `Moderate` | Dorra LBE only | 1 record (LBE #36) |

> **Note**: Column header has typo — `Catrgory` (Dorra LBE) and `NCR Catogory` (INCR files). Both are misspelled.
> CRPO-160 LBE does **not** have a Category column at all.

### 5.3 Repeat Violation / Repeated Yes / No

| Value | Where |
|-------|-------|
| `No` | All files (majority) |
| `Yes` | Dorra LBE — **5 records** (LBE #36, #39, #40, #42, #46) |

### 5.4 Escalated to SA NCR
- **Always empty** across all files. Column exists in LBE files only.
- Designed for tracking when a Standard Violation (LBE) is escalated to a formal NCR.

### 5.5 Discipline

| Value | INCR Files | LBE Files |
|-------|-----------|-----------|
| `Structure` | Dorra INCR (11), CRPO-160 INCR (6) | — |
| `Mechanical` | Dorra INCR (1) | Dorra LBE (14), CRPO-160 LBE (3) |
| `Coating` | — | Dorra LBE (1) |
| `Electrical` | CRPO-160 INCR (1) | — |

### 5.6 Area of Function (INCR only)

| Value | File |
|-------|------|
| `Construction` | Dorra INCR (11) |
| `Design & Engineering` | Dorra INCR (1) |
| *(empty)* | CRPO-160 INCR (all 7) |

### 5.7 Project

| Value | Files |
|-------|-------|
| `Dorra` | Dorra LBE, Dorra INCR (implicit) |
| `CRPO160` / `CRPO-160` | CRPO-160 LBE, CRPO-160 INCR (implicit) |

### 5.8 Location

| Value | Files |
|-------|-------|
| `Hazira` / `HAZIRA` | All files (only location in dataset) |

---

## 6. Key Problem Description Columns

### LBE Files
| Column | Purpose | Always filled? |
|--------|---------|----------------|
| **Notification Title** | Short problem summary (1 line) | ✅ Yes (100%) |
| **Subject** | Detailed problem narrative (multi-line) | ✅ Yes (100%) |

### INCR Files — Dorra
| Column | Purpose | Always filled? |
|--------|---------|----------------|
| **Description of Non-Conformance** | Full problem description | ✅ Yes (100%) |
| *(no Title column)* | — | — |

### INCR Files — CRPO-160
| Column | Purpose | Always filled? |
|--------|---------|----------------|
| **Title** | Short problem title | ✅ Yes (100%) |
| **Description of Non-Conformance** | Full problem description | ✅ Yes (100%) |

---

## 7. Risk Analysis Columns

The following columns are most relevant for risk detection and analysis:

| Column | Risk Signal | Rationale |
|--------|-------------|-----------|
| **Repeat Violation** | 🔴 High | Indicates recurring quality failures |
| **Status** = "Open" | 🟡 Medium | Unresolved issues need attention |
| **NCR Catogory** = "Moderate" | 🟡 Medium | Higher severity than "Minor" |
| **Escalated to SA NCR** | 🔴 High | Formal escalation (currently empty but important for future data) |
| **ACD** vs **Closing Date** | 🟡 Medium | ACD overdue → risk of timeline breach |
| **ACD Extended** | 🟡 Medium | Extension implies delayed resolution |
| **Notification Title** pattern | 🟡 Medium | Recurring keywords = systemic issue |
| **Discipline** concentration | 🟡 Medium | Repeated issues in same discipline |
| **Contractor** | 🟡 Medium | Repeated contractor-related issues |

---

## 8. Duplicate Records

- **Dorra LBE**: 15 unique Sl No. values (33–47) — ✅ No duplicates
- **CRPO-160 LBE**: 3 unique Sl No. values (8–10) — ✅ No duplicates
- **Dorra INCR**: 12 unique SN values (27–38) — ✅ No duplicates
- **CRPO-160 INCR**: 7 unique SN values (23–29) — ✅ No duplicates

**Cross-file**: One `Notification Title` appears twice in Dorra LBE:
> "finish coat surface was observed to have paint drips, sagging, dry spray, foreign matter and missed coating areas"
>
> Appears as LBE #38 and LBE #42 — **different records with same title** (different dates, different LBE numbers). These are NOT duplicates but indicate a **repeat occurrence** of the same type of quality issue.

---

## 9. Empty/Null Field Summary

### Always empty across all data:
- `ACD Extended` (LBE files)
- `Escalated to SA NCR` (LBE files)
- `Remark`/`Remarks` (all files)
- `Preventive Action Proposed` (Dorra INCR)
- `PO No.`, `Lot No.` (CRPO-160 INCR)
- `Risk and Opportunity` (CRPO-160 INCR)
- `Necessity to change in QMS` (CRPO-160 INCR)
- `Type of Violation` (CRPO-160 INCR)
- `Corrective Action` (CRPO-160 INCR — 86% empty)

---

## 10. Column Name Inconsistencies (Typos & Variations)

| Intended Name | Dorra LBE | CRPO-160 LBE | Dorra INCR | CRPO-160 INCR |
|---------------|-----------|--------------|------------|---------------|
| Category | `Catrgory` | *(missing)* | `NCR Catogory` | `NCR Catogory` |
| Received Date | `Recived Date` | *(missing)* | — | — |
| ACD Extended | `ACD Extended` | `ACD Extended` | — | `Extend ACD` |
| Repeat Violation | `Repeat Violation` | `Repeat Violation` | `Repeated Yes / No` | `Repeated Yes / No` |
| Status | `Status` | `Status` | `NCR Status` | `NCR Status` |
| Closing Date | `Closing Date` | `Closing Date` | `NCR closed date by COMPANY` | `NCR closed date by COMPANY` |
| Response | `SAPMT/Contractor Response / Action Taken` | `SAPMT/Contractor Response / Action Taken` | — | — |
| Notification Title | `Notification Title` | `Notification Title` | — | `Title` |
| Subject/Description | `Subject` | `Subject` | `Description of Non-Conformance` | `Description of Non-Conformance` |
| Initiator | `Initiator` | `Initiator` | — | `Initiated by` |

---

## 11. All Notification Titles (LBE Records)

1. Non-Compliance with Sch-Q Requirements for shop / field welding inspection personnel.
2. Welder identification not indicated on weld joint
3. Construction phase quality personnel requirements
4. Incorrect Welder Symbol & Missing Weld Identification
5. welding consumables
6. finish coat surface was observed to have paint drips, sagging, dry spray, foreign matter and missed coating areas *(appears 2×)*
7. Inspection coverage and Weld Identification
8. Installation of Material 2" Nipple (Surplus Material) without Material Receiving Inspection (MRI)
9. RFI Rejected - Nonconformance in stiffener installation for Conductor Cone
10. IFC Drawing requirement
11. the applicable WPS was not identified in the Weld Matrix
12. Verified welder assigned for production welding
13. Adjacent weld beads joints were not properly staggered.
14. Requirements of the approved procedure of Heat Straightening
15. RFI REJECTED - CONTRACTOR UTILISED UNQUALIFIED WELDER FOR TACK WELDING ACTIVITIES
16. WELDING UNDER WET CONDITIONS
17. RFI REJECTED - MISMATCH OBSERVED IN BOTTOM BEAM FLANGE JOINT

## 12. All Titles (INCR Records)

### CRPO-160 INCR (has explicit Title column):
1. Weld joint identification error in drawing
2. Use of Low Hydrogen Electrodes Beyond Allowable Exposure Time
3. Incorrect orientation observed during Fit-up in E&I Support
4. Distortion of Bund Plate on Equipment Support Frame
5. Discrepancy in material traceability and documentation compliance during material receiving inspection
6. Temporary Attachment Weld distance not maintained
7. Electrical LV cables received in damage condition

### Dorra INCR (no Title column — uses Description of Non-Conformance):
1. Dimensional inspection deviation — West Boat Landing straightness
2. Fit-up inspection non-conformance — Joint T36 & T37
3. Surveillance observation — Conductor Guide Stub stiffener issue
4. Surveillance — partial root welding of Barge Bumper TKY Joint
5. Shop Drawing review — component category designation error (King Post)
6. Shop Drawing review — Pile GA Drawing component category error
7. Final dimensional inspection — Bracing of CGF-4
8. Surveillance — welding machine with deficient earth connection
9. Fit-up inspection — Anode Joints corrosion after water drizzling
10. Material Identification Inspection — stencilling requirement
11. Weld visual inspection — Welder number mismatch in Matrix
12. Weld visual inspection — joint offered with incomplete weld

---

## 13. Summary of Findings

### Key Observations:
1. **Two distinct record types** (INCR and LBE) with different column structures must be normalized into a common model.
2. **Column naming is inconsistent** across files — same concept uses different headers and contains typos.
3. **Dates are primarily Excel serial numbers** with occasional DD-MM-YYYY strings and multi-value cells.
4. **The Dorra INCR file has an embedded summary table** (rows 0–9) before the actual data (row 11+).
5. **The CRPO-160 INCR file has significantly more columns** (30 vs 21) including additional fields like `Reference Document`, `PO No.`, `Lot No.`, and `Initiated by`.
6. **All records are from a single location** (Hazira) and primarily from Structure/Mechanical disciplines.
7. **Five repeat violations exist** in the dataset (Dorra LBE: #36, #39, #40, #42, #46) — indicating systemic recurring issues.
8. **No records have been escalated** to SA NCR yet.
9. **All NCR categories are "Minor"** except one "Moderate" LBE.
10. **Welding-related issues dominate** the quality findings — welder identification, WPS compliance, electrode handling, joint fit-up.
