/**
 * Validation Script — Verifies the data mapping logic against all Excel files.
 * Tests date conversion, column mapping, normalization, and edge cases.
 */
const XLSX = require('xlsx');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

// === Date conversion test ===
console.log('\n=== DATE CONVERSION TESTS ===');

function excelSerialToISO(serial) {
  if (serial === null || serial === undefined || serial === '') return null;
  const num = Number(serial);
  if (isNaN(num) || num < 1) return null;
  // Account for Lotus 1-2-3 leap year bug (serial 60 = non-existent Feb 29, 1900)
  const adjustedSerial = num > 60 ? num - 1 : num;
  const msPerDay = 86400000;
  const baseDate = Date.UTC(1900, 0, 1); // Jan 1, 1900
  const ms = baseDate + (adjustedSerial - 1) * msPerDay;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  // Try Excel serial
  if (/^\d+$/.test(dateStr.trim())) {
    return excelSerialToISO(Number(dateStr.trim()));
  }
  // Try DD-MM-YYYY
  const ddmmyyyy = dateStr.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }
  // Try M/D/YY
  const mdyy = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdyy) {
    return `20${mdyy[3]}-${String(mdyy[1]).padStart(2, '0')}-${String(mdyy[2]).padStart(2, '0')}`;
  }
  // Multi-value — take first
  if (dateStr.includes(',')) {
    return parseDateString(dateStr.split(',')[0].trim());
  }
  return null;
}

assert(excelSerialToISO(46207) === '2026-07-04', '46207 → 2026-07-04');
assert(excelSerialToISO(46212) === '2026-07-09', '46212 → 2026-07-09');
assert(excelSerialToISO(46244) === '2026-08-10', '46244 → 2026-08-10');
assert(excelSerialToISO(46205) === '2026-07-02', '46205 → 2026-07-02');
assert(parseDateString('16-07-2026') === '2026-07-16', 'DD-MM-YYYY: 16-07-2026');
assert(parseDateString('7/31/26') === '2026-07-31', 'M/D/YY: 7/31/26');
assert(parseDateString('46207') === '2026-07-04', 'Serial as string: 46207');
assert(parseDateString('16-07-2026,\r\n29-07-2026') === '2026-07-16', 'Multi-value: takes first date');
assert(parseDateString(null) === null, 'null → null');
assert(parseDateString('') === null, 'empty → null');

// === Column mapping validation ===
console.log('\n=== COLUMN MAPPING VALIDATION ===');

function getCellValue(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = sheet[addr];
  if (!cell) return null;
  return cell.v !== undefined ? String(cell.v).trim() : null;
}

function getHeaders(sheet, headerRow, maxCol) {
  const headers = {};
  for (let c = 0; c <= maxCol; c++) {
    const v = getCellValue(sheet, headerRow, c);
    if (v) headers[c] = v.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return headers;
}

// Test Dorra LBE
console.log('\n--- Dorra LBE LOG ---');
const dorraLbe = XLSX.readFile(path.join(DATA_DIR, 'Dorra LBE LOG.xlsx'));
const dorraLbeSheet = dorraLbe.Sheets['Standard Violation'];
const dorraLbeRange = XLSX.utils.decode_range(dorraLbeSheet['!ref']);
const dorraLbeHeaders = getHeaders(dorraLbeSheet, 2, dorraLbeRange.e.c);

assert(dorraLbeHeaders[0] === 'Sl No.', 'Col 0 = Sl No.');
assert(dorraLbeHeaders[1] === 'LBE No.', 'Col 1 = LBE No.');
assert(dorraLbeHeaders[7] === 'Notification Title', 'Col 7 = Notification Title');
assert(dorraLbeHeaders[9] === 'Subject', 'Col 9 = Subject');
assert(dorraLbeHeaders[14] === 'Status', 'Col 14 = Status');
assert(dorraLbeHeaders[17] === 'Repeat Violation', 'Col 17 = Repeat Violation');
assert(dorraLbeHeaders[18] === 'Catrgory', 'Col 18 = Catrgory (typo in source)');

// Verify first data row
const firstLbeTitle = getCellValue(dorraLbeSheet, 3, 7);
assert(firstLbeTitle !== null && firstLbeTitle.length > 0, 'First LBE row has Notification Title');
assert(getCellValue(dorraLbeSheet, 3, 14) === 'Closed', 'First LBE status = Closed');
assert(getCellValue(dorraLbeSheet, 3, 2) === 'Dorra', 'First LBE project = Dorra');

// Count data rows
let dorraLbeCount = 0;
for (let r = 3; r <= dorraLbeRange.e.r; r++) {
  if (getCellValue(dorraLbeSheet, r, 0)) dorraLbeCount++;
}
assert(dorraLbeCount === 15, `Dorra LBE has 15 data rows (found ${dorraLbeCount})`);

// Test CRPO-160 LBE
console.log('\n--- CRPO-160 LBE LOG ---');
const crpoLbe = XLSX.readFile(path.join(DATA_DIR, 'CRPO-160-LBE LOG.xlsx'));
const crpoLbeSheet = crpoLbe.Sheets['Standard Violation'];
const crpoLbeRange = XLSX.utils.decode_range(crpoLbeSheet['!ref']);
const crpoLbeHeaders = getHeaders(crpoLbeSheet, 2, crpoLbeRange.e.c);

assert(crpoLbeHeaders[6] === 'Notification Title', 'Col 6 = Notification Title (no Received Date col)');
assert(crpoLbeHeaders[8] === 'Subject', 'Col 8 = Subject');
assert(!Object.values(crpoLbeHeaders).includes('Catrgory'), 'CRPO-160 LBE has no Category column');
assert(!Object.values(crpoLbeHeaders).includes('Recived Date'), 'CRPO-160 LBE has no Received Date column');

let crpoLbeCount = 0;
for (let r = 3; r <= crpoLbeRange.e.r; r++) {
  if (getCellValue(crpoLbeSheet, r, 0)) crpoLbeCount++;
}
assert(crpoLbeCount === 3, `CRPO-160 LBE has 3 data rows (found ${crpoLbeCount})`);

// Test Dorra INCR
console.log('\n--- Dorra INCR LOG ---');
const dorraIncr = XLSX.readFile(path.join(DATA_DIR, 'Dorra INCR LOG.xlsx'));
const dorraIncrSheet = dorraIncr.Sheets['NCR Register'];
const dorraIncrRange = XLSX.utils.decode_range(dorraIncrSheet['!ref']);
const dorraIncrHeaders = getHeaders(dorraIncrSheet, 11, dorraIncrRange.e.c);

assert(dorraIncrHeaders[0] === 'SN', 'Col 0 = SN');
assert(dorraIncrHeaders[1] === 'NCR No.', 'Col 1 = NCR No.');
assert(dorraIncrHeaders[8] === 'NCR Status', 'Col 8 = NCR Status');
assert(dorraIncrHeaders[9] === 'Description of Non-Conformance', 'Col 9 = Description of Non-Conformance');
assert(!Object.values(dorraIncrHeaders).includes('Title'), 'Dorra INCR has NO Title column');
assert(dorraIncrHeaders[19] && dorraIncrHeaders[19].includes('Repeated'), 'Col 19 = Repeated Yes / No');

let dorraIncrCount = 0;
for (let r = 12; r <= dorraIncrRange.e.r; r++) {
  if (getCellValue(dorraIncrSheet, r, 0)) dorraIncrCount++;
}
assert(dorraIncrCount === 12, `Dorra INCR has 12 data rows (found ${dorraIncrCount})`);

// Verify summary table exists in rows 2-9
assert(getCellValue(dorraIncrSheet, 2, 1) === 'SUMMARY', 'Row 2 contains SUMMARY table');
assert(getCellValue(dorraIncrSheet, 6, 1) === 'FABRICATION', 'Row 6 contains FABRICATION in summary');

// Test CRPO-160 INCR
console.log('\n--- CRPO-160 INCR LOG ---');
const crpoIncr = XLSX.readFile(path.join(DATA_DIR, 'CRPO-160-INCR LOG - Hazira Yard.xlsx'));
const crpoIncrSheet = crpoIncr.Sheets['NCR Register'];
const crpoIncrRange = XLSX.utils.decode_range(crpoIncrSheet['!ref']);
const crpoIncrHeaders = getHeaders(crpoIncrSheet, 1, crpoIncrRange.e.c);

assert(crpoIncrHeaders[0] === 'SN', 'Col 0 = SN');
assert(crpoIncrHeaders[1] === 'NCR No.', 'Col 1 = NCR No.');
assert(crpoIncrHeaders[12] === 'NCR Status', 'Col 12 = NCR Status');
assert(crpoIncrHeaders[13] === 'Title', 'Col 13 = Title');
assert(crpoIncrHeaders[14] === 'Description of Non-Conformance', 'Col 14 = Description of Non-Conformance');
assert(Object.values(crpoIncrHeaders).includes('Initiated by'), 'Has "Initiated by" column');

let crpoIncrCount = 0;
for (let r = 2; r <= crpoIncrRange.e.r; r++) {
  if (getCellValue(crpoIncrSheet, r, 0)) crpoIncrCount++;
}
assert(crpoIncrCount === 7, `CRPO-160 INCR has 7 data rows (found ${crpoIncrCount})`);

// === Status value validation ===
console.log('\n=== STATUS & ENUM VALIDATION ===');
const validStatuses = new Set(['Closed', 'Open', 'Withdrawn']);

// Collect all statuses from all files
const allStatuses = new Set();
// Dorra LBE - col 14
for (let r = 3; r <= dorraLbeRange.e.r; r++) {
  const s = getCellValue(dorraLbeSheet, r, 14);
  if (s) allStatuses.add(s);
}
// CRPO LBE - find status col
const crpoLbeStatusCol = Object.entries(crpoLbeHeaders).find(([, v]) => v === 'Status');
if (crpoLbeStatusCol) {
  for (let r = 3; r <= crpoLbeRange.e.r; r++) {
    const s = getCellValue(crpoLbeSheet, r, Number(crpoLbeStatusCol[0]));
    if (s) allStatuses.add(s);
  }
}
// Dorra INCR - col 8
for (let r = 12; r <= dorraIncrRange.e.r; r++) {
  const s = getCellValue(dorraIncrSheet, r, 8);
  if (s) allStatuses.add(s);
}
// CRPO INCR - col 12
for (let r = 2; r <= crpoIncrRange.e.r; r++) {
  const s = getCellValue(crpoIncrSheet, r, 12);
  if (s) allStatuses.add(s);
}

console.log(`  All status values found: ${JSON.stringify([...allStatuses])}`);
for (const s of allStatuses) {
  assert(validStatuses.has(s), `Status "${s}" is a known valid status`);
}

// === Repeat Violation check ===
console.log('\n=== REPEAT VIOLATION VALIDATION ===');
let repeatCount = 0;
// Dorra LBE - col 17
for (let r = 3; r <= dorraLbeRange.e.r; r++) {
  const v = getCellValue(dorraLbeSheet, r, 17);
  if (v === 'Yes') repeatCount++;
}
assert(repeatCount === 5, `Exactly 5 repeat violations in Dorra LBE (found ${repeatCount})`);

// === Total record count ===
console.log('\n=== TOTAL RECORD COUNT ===');
const total = dorraLbeCount + crpoLbeCount + dorraIncrCount + crpoIncrCount;
assert(total === 37, `Total records across all files = 37 (got ${total})`);
console.log(`  LBE records: ${dorraLbeCount + crpoLbeCount} (${dorraLbeCount} Dorra + ${crpoLbeCount} CRPO-160)`);
console.log(`  INCR records: ${dorraIncrCount + crpoIncrCount} (${dorraIncrCount} Dorra + ${crpoIncrCount} CRPO-160)`);

// === Mixed date format check ===
console.log('\n=== MIXED DATE FORMAT EDGE CASES ===');
// CRPO-160 LBE Response Date column
const rdCol = Object.entries(crpoLbeHeaders).find(([, v]) => v === 'Response Date');
if (rdCol) {
  for (let r = 3; r <= crpoLbeRange.e.r; r++) {
    const v = getCellValue(crpoLbeSheet, r, Number(rdCol[0]));
    if (v) {
      const parsed = parseDateString(v);
      assert(parsed !== null, `CRPO-160 LBE row ${r} Response Date "${v.substring(0, 30)}..." → ${parsed}`);
    }
  }
}

// === Final Summary ===
console.log(`\n${'='.repeat(60)}`);
console.log(`VALIDATION RESULTS: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}`);
if (failed > 0) {
  process.exit(1);
}
