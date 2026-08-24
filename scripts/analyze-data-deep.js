/**
 * Deep Excel Analysis Script - handles merged cells and multi-row headers
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

const FILES = [
  'Dorra INCR LOG.xlsx',
  'Dorra LBE LOG.xlsx',
  'CRPO-160-INCR LOG - Hazira Yard.xlsx',
  'CRPO-160-LBE LOG.xlsx',
];

function getCellValue(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = sheet[addr];
  if (!cell) return null;
  return cell.v !== undefined ? String(cell.v).trim() : null;
}

function analyzeSheet(sheet, sheetName, fileName) {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const merges = sheet['!merges'] || [];

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`SHEET: "${sheetName}" in "${fileName}"`);
  console.log(`Range: ${sheet['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1}`);
  console.log(`Merged regions: ${merges.length}`);

  // Print merged regions
  for (const m of merges.slice(0, 20)) {
    const val = getCellValue(sheet, m.s.r, m.s.c);
    console.log(`  Merge: ${XLSX.utils.encode_range(m)} => "${val}"`);
  }
  if (merges.length > 20) console.log(`  ... and ${merges.length - 20} more`);

  // Print first 8 rows raw to understand structure
  console.log(`\nRAW FIRST 8 ROWS:`);
  for (let r = 0; r <= Math.min(7, range.e.r); r++) {
    const row = [];
    for (let c = 0; c <= Math.min(range.e.c, 25); c++) {
      const v = getCellValue(sheet, r, c);
      if (v !== null) {
        row.push(`[${c}]="${v.substring(0, 60)}"`);
      }
    }
    console.log(`  Row ${r}: ${row.join(' | ')}`);
  }

  // Detect header row - find row with most non-empty cells that contains known keywords
  const headerKeywords = ['no', 'date', 'status', 'subject', 'title', 'category', 'discipline', 'project', 'location', 'contractor', 'remark', 'violation', 'escalat'];
  let bestHeaderRow = -1;
  let bestScore = 0;

  for (let r = 0; r <= Math.min(10, range.e.r); r++) {
    let score = 0;
    let nonEmpty = 0;
    for (let c = 0; c <= range.e.c; c++) {
      const v = getCellValue(sheet, r, c);
      if (v !== null) {
        nonEmpty++;
        const lower = v.toLowerCase().replace(/\r\n/g, ' ');
        for (const kw of headerKeywords) {
          if (lower.includes(kw)) {
            score++;
            break;
          }
        }
      }
    }
    if (score > bestScore || (score === bestScore && nonEmpty > 5)) {
      bestScore = score;
      bestHeaderRow = r;
    }
  }

  console.log(`\nDetected header row: ${bestHeaderRow} (score: ${bestScore})`);

  // Extract headers from the detected row
  const headers = {};
  if (bestHeaderRow >= 0) {
    for (let c = 0; c <= range.e.c; c++) {
      const v = getCellValue(sheet, bestHeaderRow, c);
      if (v !== null) {
        headers[c] = v.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    console.log(`Headers at row ${bestHeaderRow}:`);
    for (const [c, h] of Object.entries(headers)) {
      console.log(`  Col ${c}: "${h}"`);
    }
  }

  // Also check row above for additional header info (multi-row headers)
  if (bestHeaderRow > 0) {
    const prevHeaders = {};
    for (let c = 0; c <= range.e.c; c++) {
      const v = getCellValue(sheet, bestHeaderRow - 1, c);
      if (v !== null) {
        prevHeaders[c] = v.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    if (Object.keys(prevHeaders).length > 0) {
      console.log(`\nPrevious row (${bestHeaderRow - 1}) headers (possible multi-row header):`);
      for (const [c, h] of Object.entries(prevHeaders)) {
        console.log(`  Col ${c}: "${h}"`);
      }
    }
  }

  // Extract data rows
  const dataStartRow = bestHeaderRow + 1;
  const headerCols = Object.keys(headers).map(Number);
  const dataRows = [];

  for (let r = dataStartRow; r <= range.e.r; r++) {
    const row = {};
    let hasData = false;
    for (const c of headerCols) {
      const v = getCellValue(sheet, r, c);
      row[headers[c]] = v;
      if (v !== null && v !== '') hasData = true;
    }
    // Also read cells from any additional columns
    for (let c = 0; c <= range.e.c; c++) {
      if (!headers[c]) {
        const v = getCellValue(sheet, r, c);
        if (v !== null) row[`_unmapped_col_${c}`] = v;
      }
    }
    if (hasData) dataRows.push(row);
  }

  console.log(`\nData rows extracted: ${dataRows.length}`);

  // Column-by-column analysis with actual headers
  console.log(`\nCOLUMN ANALYSIS:`);
  for (const [, colName] of Object.entries(headers)) {
    const values = dataRows.map(r => r[colName]);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const unique = [...new Set(nonNull)];

    console.log(`\n  "${colName}":`);
    console.log(`    Filled: ${nonNull.length}/${values.length} (${((nonNull.length/values.length)*100).toFixed(0)}%)`);
    console.log(`    Unique: ${unique.length}`);

    if (unique.length <= 25 && unique.length > 0) {
      console.log(`    Values: ${JSON.stringify(unique)}`);
    } else if (unique.length > 25) {
      console.log(`    Sample: ${JSON.stringify(unique.slice(0, 8))}`);
    }
  }

  // Print first 3 complete data rows
  console.log(`\nFIRST 3 DATA ROWS:`);
  for (let i = 0; i < Math.min(3, dataRows.length); i++) {
    console.log(`  Row ${i + 1}:`);
    for (const [k, v] of Object.entries(dataRows[i])) {
      if (v !== null && v !== undefined) {
        console.log(`    ${k}: "${String(v).substring(0, 100)}"`);
      }
    }
  }

  return { headers, dataRows, headerRow: bestHeaderRow };
}

// Main
const allResults = {};
for (const fileName of FILES) {
  const filePath = path.join(DATA_DIR, fileName);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${fileName} (${fs.statSync(filePath).size} bytes)`);
  console.log(`${'='.repeat(80)}`);

  const wb = XLSX.readFile(filePath, { cellDates: false });
  console.log(`Sheets: ${JSON.stringify(wb.SheetNames)}`);

  for (const sn of wb.SheetNames) {
    const result = analyzeSheet(wb.Sheets[sn], sn, fileName);
    allResults[`${fileName}::${sn}`] = {
      fileName,
      sheetName: sn,
      ...result,
    };
  }
}

// Summary comparison
console.log(`\n\n${'='.repeat(80)}`);
console.log('SUMMARY COMPARISON');
console.log(`${'='.repeat(80)}`);

for (const [key, info] of Object.entries(allResults)) {
  const headerNames = Object.values(info.headers);
  console.log(`\n${key}:`);
  console.log(`  Header row: ${info.headerRow}`);
  console.log(`  Data rows: ${info.dataRows.length}`);
  console.log(`  Columns: ${headerNames.join(' | ')}`);
}
