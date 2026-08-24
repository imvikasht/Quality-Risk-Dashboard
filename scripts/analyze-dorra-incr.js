/**
 * Specific deep-dive into the Dorra INCR LOG file which has a complex structure
 */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'data', 'Dorra INCR LOG.xlsx');
const wb = XLSX.readFile(filePath, { cellDates: false });

console.log('Sheets:', wb.SheetNames);

for (const sn of wb.SheetNames) {
  const sheet = wb.Sheets[sn];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const merges = sheet['!merges'] || [];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`SHEET: "${sn}"`);
  console.log(`Range: ${sheet['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1}`);
  console.log(`Merges: ${merges.length}`);

  for (const m of merges) {
    const addr = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
    const cell = sheet[addr];
    const val = cell ? String(cell.v || '').substring(0, 80) : 'null';
    console.log(`  ${XLSX.utils.encode_range(m)} => "${val}"`);
  }

  // Print ALL rows raw
  console.log(`\nALL ROWS (raw):`);
  for (let r = 0; r <= range.e.r; r++) {
    const cells = [];
    for (let c = 0; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell && cell.v !== undefined) {
        const val = String(cell.v).substring(0, 60).replace(/\r\n/g, '↵');
        cells.push(`[${c}]="${val}"`);
      }
    }
    if (cells.length > 0) {
      console.log(`  Row ${r}: ${cells.join(' | ')}`);
    } else {
      console.log(`  Row ${r}: (empty)`);
    }
  }
}
