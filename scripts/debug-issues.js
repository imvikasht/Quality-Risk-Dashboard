/**
 * Debug the date conversion and repeat violation issues
 */
const XLSX = require('xlsx');
const path = require('path');

// Fix date conversion — Excel serial starts from 1899-12-30
function excelSerialToISO(serial) {
  if (serial === null || serial === undefined || serial === '') return null;
  const num = Number(serial);
  if (isNaN(num) || num < 1) return null;
  // Excel epoch is December 30, 1899
  // JS Date.UTC(1899, 11, 30) = 1899-12-30
  const msPerDay = 86400000;
  const excelEpoch = Date.UTC(1899, 11, 30); // Dec 30, 1899
  const ms = excelEpoch + num * msPerDay;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('Date conversion tests:');
console.log('46207 =>', excelSerialToISO(46207));
console.log('46212 =>', excelSerialToISO(46212));
console.log('46244 =>', excelSerialToISO(46244));
console.log('46205 =>', excelSerialToISO(46205));

// The issue is the setUTCDate approach. Let's calculate manually
// Excel serial 1 = 1900-01-01
// But Excel has the Lotus 1-2-3 bug where it thinks 1900 is a leap year
// So serial 60 = 1900-02-29 (which doesn't exist) and serial 61 = 1900-03-01
// For serials > 60, we need to subtract 1 day to compensate
function excelSerialToISO_v2(serial) {
  if (serial === null || serial === undefined || serial === '') return null;
  const num = Number(serial);
  if (isNaN(num) || num < 1) return null;
  
  // Account for the Excel leap year bug
  const adjustedSerial = num > 60 ? num - 1 : num;
  const msPerDay = 86400000;
  // Serial 1 = 1900-01-01
  const baseDate = Date.UTC(1900, 0, 1); // Jan 1, 1900
  const ms = baseDate + (adjustedSerial - 1) * msPerDay;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('\nV2 Date conversion:');
console.log('46207 =>', excelSerialToISO_v2(46207));
console.log('46212 =>', excelSerialToISO_v2(46212));
console.log('46244 =>', excelSerialToISO_v2(46244));
console.log('46205 =>', excelSerialToISO_v2(46205));
console.log('1 =>', excelSerialToISO_v2(1)); // Should be 1900-01-01

// Let's also check what XLSX thinks these dates are
const wb = XLSX.readFile(path.join(__dirname, '..', 'data', 'Dorra LBE LOG.xlsx'), { cellDates: true });
const sheet = wb.Sheets['Standard Violation'];
// Check cell F4 (Issued Date, row 3, col 5) — should be a date
const cell = sheet[XLSX.utils.encode_cell({ r: 3, c: 5 })];
console.log('\nXLSX with cellDates=true, F4:', cell);

// Read without cellDates
const wb2 = XLSX.readFile(path.join(__dirname, '..', 'data', 'Dorra LBE LOG.xlsx'), { cellDates: false });
const sheet2 = wb2.Sheets['Standard Violation'];
const cell2 = sheet2[XLSX.utils.encode_cell({ r: 3, c: 5 })];
console.log('XLSX with cellDates=false, F4:', cell2);

// Check repeat violation — read all values in col 17
console.log('\n=== Repeat Violation Debug ===');
const range = XLSX.utils.decode_range(sheet2['!ref']);
for (let r = 3; r <= range.e.r; r++) {
  const slNo = sheet2[XLSX.utils.encode_cell({ r, c: 0 })];
  const rv = sheet2[XLSX.utils.encode_cell({ r, c: 17 })];
  console.log(`  Row ${r} (Sl ${slNo?.v}): col 17 = ${JSON.stringify(rv?.v)} (type: ${typeof rv?.v})`);
}
