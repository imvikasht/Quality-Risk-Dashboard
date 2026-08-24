/**
 * Extract key categorical values from all files for the analysis document
 */
const XLSX = require('xlsx');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

function getCellValue(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = sheet[addr];
  if (!cell) return null;
  return cell.v !== undefined ? String(cell.v).trim() : null;
}

function extractData(filePath, headerRowIdx) {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref']);

  // Get headers
  const headers = {};
  for (let c = 0; c <= range.e.c; c++) {
    const v = getCellValue(sheet, headerRowIdx, c);
    if (v) headers[c] = v.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Get data
  const rows = [];
  for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
    const row = {};
    let hasData = false;
    for (const [c, name] of Object.entries(headers)) {
      const v = getCellValue(sheet, r, Number(c));
      row[name] = v;
      if (v) hasData = true;
    }
    if (hasData) rows.push(row);
  }
  return { headers: Object.values(headers), rows };
}

// Dorra LBE - header at row 2
const dorraLbe = extractData(path.join(DATA_DIR, 'Dorra LBE LOG.xlsx'), 2);
console.log('=== Dorra LBE LOG ===');
console.log('Rows:', dorraLbe.rows.length);
console.log('Status values:', [...new Set(dorraLbe.rows.map(r => r['Status']).filter(Boolean))]);
console.log('Category values:', [...new Set(dorraLbe.rows.map(r => r['Catrgory']).filter(Boolean))]);
console.log('Repeat Violation:', [...new Set(dorraLbe.rows.map(r => r['Repeat Violation']).filter(Boolean))]);
console.log('Escalated to SA NCR:', [...new Set(dorraLbe.rows.map(r => r['Escalated to SA NCR']).filter(Boolean))]);
console.log('Disciplines:', [...new Set(dorraLbe.rows.map(r => r['Discipline']).filter(Boolean))]);
console.log('ACD Extended:', [...new Set(dorraLbe.rows.map(r => r['ACD Extended']).filter(Boolean))]);
console.log('Closing Date filled:', dorraLbe.rows.filter(r => r['Closing Date']).length);
console.log('Received Date filled:', dorraLbe.rows.filter(r => r['Recived Date']).length);

// CRPO-160 LBE - header at row 2
const crpoLbe = extractData(path.join(DATA_DIR, 'CRPO-160-LBE LOG.xlsx'), 2);
console.log('\n=== CRPO-160 LBE LOG ===');
console.log('Rows:', crpoLbe.rows.length);
console.log('Headers:', crpoLbe.headers);
console.log('Status values:', [...new Set(crpoLbe.rows.map(r => r['Status']).filter(Boolean))]);
console.log('Repeat Violation:', [...new Set(crpoLbe.rows.map(r => r['Repeat Violation']).filter(Boolean))]);
console.log('Escalated to SA NCR:', [...new Set(crpoLbe.rows.map(r => r['Escalated to SA NCR']).filter(Boolean))]);

// Dorra INCR - header at row 11
const dorraIncr = extractData(path.join(DATA_DIR, 'Dorra INCR LOG.xlsx'), 11);
console.log('\n=== Dorra INCR LOG ===');
console.log('Rows:', dorraIncr.rows.length);
console.log('Headers:', dorraIncr.headers);
console.log('NCR Status values:', [...new Set(dorraIncr.rows.map(r => r['NCR Status']).filter(Boolean))]);
console.log('NCR Category:', [...new Set(dorraIncr.rows.map(r => r['NCR Catogory']).filter(Boolean))]);
console.log('Repeated Yes/No:', [...new Set(dorraIncr.rows.map(r => r['Repeated Yes / No']).filter(Boolean))]);
console.log('Disciplines:', [...new Set(dorraIncr.rows.map(r => r['Discipline']).filter(Boolean))]);
console.log('Area of Function:', [...new Set(dorraIncr.rows.map(r => r['Area of Function']).filter(Boolean))]);

// CRPO-160 INCR - header at row 1
const crpoIncr = extractData(path.join(DATA_DIR, 'CRPO-160-INCR LOG - Hazira Yard.xlsx'), 1);
console.log('\n=== CRPO-160 INCR LOG ===');
console.log('Rows:', crpoIncr.rows.length);
console.log('Headers:', crpoIncr.headers);
console.log('NCR Status values:', [...new Set(crpoIncr.rows.map(r => r['NCR Status']).filter(Boolean))]);
console.log('NCR Category:', [...new Set(crpoIncr.rows.map(r => r['NCR Catogory']).filter(Boolean))]);
console.log('Repeated Yes/No:', [...new Set(crpoIncr.rows.map(r => r['Repeated Yes / No']).filter(Boolean))]);
console.log('Disciplines:', [...new Set(crpoIncr.rows.map(r => r['Discipline']).filter(Boolean))]);
console.log('Area of Function:', [...new Set(crpoIncr.rows.map(r => r['Area of Function']).filter(Boolean))]);
console.log('Type of Violation:', [...new Set(crpoIncr.rows.map(r => r['Type of Violation']).filter(Boolean))]);
console.log('Initiated by:', [...new Set(crpoIncr.rows.map(r => r['Initiated by']).filter(Boolean))]);

// Date format check
console.log('\n=== DATE FORMAT ANALYSIS ===');
console.log('LBE dates are Excel serial numbers (e.g., 46207 = July 2026)');
const excelEpoch = new Date(1899, 11, 30);
function excelToDate(serial) {
  const d = new Date(excelEpoch.getTime() + serial * 86400000);
  return d.toISOString().split('T')[0];
}
console.log('46207 =>', excelToDate(46207));
console.log('46212 =>', excelToDate(46212));
console.log('46244 =>', excelToDate(46244));

// Check for multi-value Response Dates in LBE
console.log('\n=== MULTI-VALUE DATES ===');
for (const row of dorraLbe.rows) {
  const rd = row['Response Date'];
  if (rd && rd.includes(',')) {
    console.log(`LBE ${row['LBE No.']}: Response Date = "${rd}"`);
  }
}
for (const row of crpoLbe.rows) {
  const rd = row['Response Date'];
  if (rd && (rd.includes(',') || rd.includes('\r\n'))) {
    console.log(`CRPO LBE ${row['LBE No.']}: Response Date = "${rd}"`);
  }
}

// Notification Titles from all LBE files
console.log('\n=== ALL NOTIFICATION TITLES (LBE) ===');
for (const row of [...dorraLbe.rows, ...crpoLbe.rows]) {
  console.log(`  - ${row['Notification Title']}`);
}

// Titles from all INCR files
console.log('\n=== ALL TITLES (INCR) ===');
for (const row of dorraIncr.rows) {
  // INCR uses "Description of Non-Conformance" as main description, no separate title
  const desc = row['Description of Non-Conformance'];
  console.log(`  - ${desc ? desc.substring(0, 120) : 'N/A'}`);
}
for (const row of crpoIncr.rows) {
  console.log(`  - ${row['Title'] || 'N/A'}`);
}
