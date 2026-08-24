/**
 * Data Analysis Script for Quality Risk Dashboard
 * Inspects all Excel files in data/ and outputs a comprehensive analysis.
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

const IMPORTANT_COLUMNS = [
  'Notification Title', 'Subject', 'Status', 'Repeat Violation',
  'Category', 'ACD', 'Escalated to SA NCR', 'Project', 'Discipline',
  'Location', 'LBE No.', 'INCR No.', 'Issued Date', 'Received Date',
  'Response Date', 'Closing Date', 'ACD Extended', 'Contractor',
  'Response / Action Taken', 'Remark',
];

function analyzeFile(filePath, fileName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${fileName}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`File size: ${fs.statSync(filePath).size} bytes`);

  const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: true, cellStyles: true });

  console.log(`\nWorkbook properties:`);
  console.log(`  Sheet names: ${JSON.stringify(workbook.SheetNames)}`);
  console.log(`  Number of sheets: ${workbook.SheetNames.length}`);

  const results = {};

  for (const sheetName of workbook.SheetNames) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`SHEET: "${sheetName}"`);
    console.log(`${'─'.repeat(60)}`);

    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    console.log(`  Range: ${sheet['!ref']}`);
    console.log(`  Rows: ${range.e.r - range.s.r + 1}, Columns: ${range.e.c - range.s.c + 1}`);

    // Find header row by scanning first 10 rows
    let headerRow = -1;
    let headers = [];
    for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
      const rowCells = [];
      let nonEmpty = 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          rowCells.push({ col: c, value: String(cell.v).trim() });
          nonEmpty++;
        }
      }
      if (nonEmpty >= 3) {
        // Likely a header row
        if (headerRow === -1) {
          headerRow = r;
          for (const rc of rowCells) {
            headers.push({ col: rc.col, name: rc.value });
          }
        }
      }
    }

    console.log(`  Header row (0-indexed): ${headerRow}`);
    console.log(`  Headers found: ${headers.length}`);
    console.log(`  Column names:`);
    for (const h of headers) {
      console.log(`    Col ${h.col}: "${h.name}"`);
    }

    // Parse data rows using json conversion
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
    const jsonDataRaw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
    console.log(`  Data rows (via sheet_to_json): ${jsonData.length}`);

    if (jsonData.length === 0) {
      console.log('  (No data rows found)');
      continue;
    }

    // Actual column names from JSON keys
    const allKeys = new Set();
    for (const row of jsonData) {
      for (const k of Object.keys(row)) {
        allKeys.add(k);
      }
    }
    const columnNames = [...allKeys];
    console.log(`\n  All column names from data (${columnNames.length}):`);
    for (const c of columnNames) {
      console.log(`    - "${c}"`);
    }

    // Column analysis
    console.log(`\n  COLUMN ANALYSIS:`);
    for (const col of columnNames) {
      const values = jsonData.map(r => r[col]);
      const rawValues = jsonDataRaw.map(r => r[col]);
      const nonNull = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      const nullCount = values.length - nonNull.length;
      const uniqueVals = [...new Set(nonNull.map(v => String(v).trim()))];

      const types = new Set();
      for (const rv of rawValues) {
        if (rv === null || rv === undefined) continue;
        types.add(typeof rv);
      }

      console.log(`\n    "${col}":`);
      console.log(`      Total: ${values.length}, Non-null: ${nonNull.length}, Null/empty: ${nullCount} (${((nullCount/values.length)*100).toFixed(1)}%)`);
      console.log(`      Unique values: ${uniqueVals.length}`);
      console.log(`      Raw data types: ${[...types].join(', ') || 'N/A'}`);

      // Show unique values for categorical columns (less than 30 unique)
      if (uniqueVals.length <= 30 && uniqueVals.length > 0) {
        console.log(`      Values: ${JSON.stringify(uniqueVals)}`);
      } else if (uniqueVals.length > 0) {
        console.log(`      Sample (first 10): ${JSON.stringify(uniqueVals.slice(0, 10))}`);
      }

      // Check for date patterns
      if (col.toLowerCase().includes('date') || col.toLowerCase().includes('acd')) {
        const datePatterns = new Set();
        for (const v of nonNull.slice(0, 20)) {
          datePatterns.add(String(v));
        }
        console.log(`      Date samples: ${JSON.stringify([...datePatterns].slice(0, 10))}`);
      }
    }

    // Check for duplicates
    console.log(`\n  DUPLICATE ANALYSIS:`);
    // Use first column as potential ID
    const idCol = columnNames.find(c =>
      c.toLowerCase().includes('no.') || c.toLowerCase().includes('no ') ||
      c.toLowerCase().includes('s.no') || c.toLowerCase().includes('sr') ||
      c.toLowerCase().includes('#')
    );
    if (idCol) {
      const idValues = jsonData.map(r => r[idCol]).filter(v => v !== null && v !== undefined);
      const idSet = new Set(idValues.map(v => String(v)));
      console.log(`    ID column: "${idCol}"`);
      console.log(`    Total values: ${idValues.length}, Unique: ${idSet.size}`);
      if (idValues.length > idSet.size) {
        console.log(`    ⚠ DUPLICATES DETECTED: ${idValues.length - idSet.size} duplicate IDs`);
        // Find duplicates
        const counts = {};
        for (const v of idValues) {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        }
        const dupes = Object.entries(counts).filter(([, c]) => c > 1);
        console.log(`    Duplicate IDs: ${JSON.stringify(dupes.slice(0, 10))}`);
      } else {
        console.log(`    ✓ No duplicate IDs`);
      }
    }

    // Check for notification title and subject
    const titleCol = columnNames.find(c => c.toLowerCase().includes('notification') && c.toLowerCase().includes('title'));
    const subjectCol = columnNames.find(c => c.toLowerCase() === 'subject' || c.toLowerCase().includes('subject'));
    console.log(`\n  KEY PROBLEM DESCRIPTION COLUMNS:`);
    console.log(`    Notification Title column: ${titleCol ? `"${titleCol}"` : 'NOT FOUND'}`);
    console.log(`    Subject column: ${subjectCol ? `"${subjectCol}"` : 'NOT FOUND'}`);

    if (titleCol) {
      const titleVals = jsonData.map(r => r[titleCol]).filter(v => v && String(v).trim());
      const uniqueTitles = [...new Set(titleVals.map(v => String(v).trim()))];
      console.log(`    Notification Title: ${titleVals.length} values, ${uniqueTitles.length} unique`);
      console.log(`    Sample titles: ${JSON.stringify(uniqueTitles.slice(0, 5))}`);
    }

    if (subjectCol) {
      const subjectVals = jsonData.map(r => r[subjectCol]).filter(v => v && String(v).trim());
      const uniqueSubjects = [...new Set(subjectVals.map(v => String(v).trim()))];
      console.log(`    Subject: ${subjectVals.length} values, ${uniqueSubjects.length} unique`);
      console.log(`    Sample subjects: ${JSON.stringify(uniqueSubjects.slice(0, 5))}`);
    }

    results[`${fileName}::${sheetName}`] = {
      fileName,
      sheetName,
      headerRow,
      columnNames,
      rowCount: jsonData.length,
      sampleRow: jsonData[0],
    };
  }

  return results;
}

// Cross-file comparison
function crossFileAnalysis(allResults) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('CROSS-FILE COMPARISON');
  console.log(`${'='.repeat(80)}`);

  const groups = {};
  for (const [key, info] of Object.entries(allResults)) {
    const type = info.fileName.includes('INCR') ? 'INCR' : 'LBE';
    if (!groups[type]) groups[type] = [];
    groups[type].push(info);
  }

  for (const [type, infos] of Object.entries(groups)) {
    console.log(`\n${type} files:`);
    for (const info of infos) {
      console.log(`  ${info.fileName} / "${info.sheetName}": ${info.rowCount} rows, ${info.columnNames.length} columns`);
    }

    // Compare columns
    if (infos.length >= 2) {
      const sets = infos.map(i => new Set(i.columnNames));
      const all = new Set(infos.flatMap(i => i.columnNames));

      console.log(`\n  Common columns across ${type} files:`);
      const common = [...all].filter(c => sets.every(s => s.has(c)));
      for (const c of common) console.log(`    ✓ "${c}"`);

      console.log(`\n  Columns unique to specific files:`);
      for (let i = 0; i < infos.length; i++) {
        const unique = [...sets[i]].filter(c => !sets.some((s, j) => j !== i && s.has(c)));
        if (unique.length > 0) {
          console.log(`    ${infos[i].fileName}: ${JSON.stringify(unique)}`);
        }
      }
    }
  }

  // INCR vs LBE comparison
  console.log(`\n\nINCR vs LBE comparison:`);
  const incrCols = new Set(Object.values(allResults).filter(r => r.fileName.includes('INCR')).flatMap(r => r.columnNames));
  const lbeCols = new Set(Object.values(allResults).filter(r => r.fileName.includes('LBE')).flatMap(r => r.columnNames));

  const onlyIncr = [...incrCols].filter(c => !lbeCols.has(c));
  const onlyLbe = [...lbeCols].filter(c => !incrCols.has(c));
  const both = [...incrCols].filter(c => lbeCols.has(c));

  console.log(`  Columns in both: ${both.length}`);
  for (const c of both) console.log(`    ✓ "${c}"`);
  console.log(`  Only in INCR (${onlyIncr.length}): ${JSON.stringify(onlyIncr)}`);
  console.log(`  Only in LBE (${onlyLbe.length}): ${JSON.stringify(onlyLbe)}`);
}

// Main
const allResults = {};
for (const fileName of FILES) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ File not found: ${filePath}`);
    continue;
  }
  const results = analyzeFile(filePath, fileName);
  Object.assign(allResults, results);
}

crossFileAnalysis(allResults);

// Output summary JSON
const summaryPath = path.join(__dirname, '..', 'docs', 'analysis_raw.json');
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));
console.log(`\n\nRaw analysis saved to: ${summaryPath}`);
