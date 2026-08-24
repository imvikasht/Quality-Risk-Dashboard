/**
 * Excel Reader — reads and parses Excel files using file-specific configs.
 *
 * Responsibilities:
 *  - Read .xlsx files from the data directory
 *  - Use the headerRow from FileParsingConfig to locate headers
 *  - Build a raw row → column-name map
 *  - Return raw row data for normalization
 *
 * Does NOT normalize values — that's the dataNormalizer's job.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { FileParsingConfig } from '../types/quality';

export interface RawRow {
  [columnName: string]: unknown;
}

export interface ParsedSheet {
  config: FileParsingConfig;
  headers: Record<number, string>;
  rows: RawRow[];
  errors: string[];
}

/**
 * Get a cell value from a sheet at the given row/column (0-indexed).
 */
function getCellValue(sheet: XLSX.WorkSheet, r: number, c: number): unknown {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = sheet[addr];
  if (!cell || cell.v === undefined || cell.v === null) return null;
  return cell.v;
}

/**
 * Read and parse a single Excel file according to its config.
 */
export function readExcelFile(dataDir: string, config: FileParsingConfig): ParsedSheet {
  const filePath = path.join(dataDir, config.fileName);
  const errors: string[] = [];

  // Check file exists
  if (!fs.existsSync(filePath)) {
    errors.push(`File not found: ${filePath}`);
    return { config, headers: {}, rows: [], errors };
  }

  // Read workbook (keep raw values, don't auto-parse dates)
  const workbook = XLSX.readFile(filePath, { cellDates: false });

  // Find the sheet
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) {
    errors.push(`Sheet "${config.sheetName}" not found in ${config.fileName}. Available: ${workbook.SheetNames.join(', ')}`);
    return { config, headers: {}, rows: [], errors };
  }

  const ref = sheet['!ref'];
  if (!ref) {
    errors.push(`Sheet "${config.sheetName}" in ${config.fileName} has no data range`);
    return { config, headers: {}, rows: [], errors };
  }

  const range = XLSX.utils.decode_range(ref);

  // Extract headers from the configured header row
  const headers: Record<number, string> = {};
  for (let c = range.s.c; c <= range.e.c; c++) {
    const val = getCellValue(sheet, config.headerRow, c);
    if (val !== null && val !== undefined) {
      const headerName = String(val)
        .replace(/\r\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (headerName !== '') {
        headers[c] = headerName;
      }
    }
  }

  if (Object.keys(headers).length === 0) {
    errors.push(`No headers found at row ${config.headerRow} in ${config.fileName}`);
    return { config, headers, rows: [], errors };
  }

  // Extract data rows (starting after the header row)
  const rows: RawRow[] = [];
  const dataStartRow = config.headerRow + 1;

  for (let r = dataStartRow; r <= range.e.r; r++) {
    const row: RawRow = {};
    let hasAnyData = false;

    for (const [colStr, headerName] of Object.entries(headers)) {
      const c = Number(colStr);
      const val = getCellValue(sheet, r, c);
      row[headerName] = val;
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        hasAnyData = true;
      }
    }

    // Skip completely empty rows
    if (!hasAnyData) continue;

    rows.push(row);
  }

  return { config, headers, rows, errors };
}

/**
 * Discover and read all Excel files in the data directory.
 * Only processes files that have a matching FileParsingConfig.
 */
export function readAllExcelFiles(dataDir: string, configs: FileParsingConfig[]): ParsedSheet[] {
  const results: ParsedSheet[] = [];

  for (const config of configs) {
    const parsed = readExcelFile(dataDir, config);
    results.push(parsed);

    if (parsed.errors.length > 0) {
      console.warn(`[ExcelReader] Warnings for ${config.fileName}:`);
      for (const err of parsed.errors) {
        console.warn(`  ⚠ ${err}`);
      }
    } else {
      console.log(`[ExcelReader] ${config.fileName}: ${parsed.rows.length} rows parsed from "${config.sheetName}"`);
    }
  }

  return results;
}
