"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readExcelFile = readExcelFile;
exports.readAllExcelFiles = readAllExcelFiles;
const XLSX = __importStar(require("xlsx"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Get a cell value from a sheet at the given row/column (0-indexed).
 */
function getCellValue(sheet, r, c) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (!cell || cell.v === undefined || cell.v === null)
        return null;
    return cell.v;
}
/**
 * Read and parse a single Excel file according to its config.
 */
function readExcelFile(dataDir, config) {
    const filePath = path.join(dataDir, config.fileName);
    const errors = [];
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
    const headers = {};
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
    const rows = [];
    const dataStartRow = config.headerRow + 1;
    for (let r = dataStartRow; r <= range.e.r; r++) {
        const row = {};
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
        if (!hasAnyData)
            continue;
        // Check for minimum viable data — at least a serial number or reference
        const firstHeader = Object.values(headers)[0];
        const firstVal = row[firstHeader];
        if (firstVal === null || firstVal === undefined || String(firstVal).trim() === '') {
            // Row has some data but no serial number — might be a footer or summary
            continue;
        }
        rows.push(row);
    }
    return { config, headers, rows, errors };
}
/**
 * Discover and read all Excel files in the data directory.
 * Only processes files that have a matching FileParsingConfig.
 */
function readAllExcelFiles(dataDir, configs) {
    const results = [];
    for (const config of configs) {
        const parsed = readExcelFile(dataDir, config);
        results.push(parsed);
        if (parsed.errors.length > 0) {
            console.warn(`[ExcelReader] Warnings for ${config.fileName}:`);
            for (const err of parsed.errors) {
                console.warn(`  ⚠ ${err}`);
            }
        }
        else {
            console.log(`[ExcelReader] ${config.fileName}: ${parsed.rows.length} rows parsed from "${config.sheetName}"`);
        }
    }
    return results;
}
//# sourceMappingURL=excelReader.js.map