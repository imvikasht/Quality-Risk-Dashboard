"use strict";
/**
 * Date and value normalization utilities.
 *
 * Handles the various date formats found in the Excel files:
 *  - Excel serial numbers (e.g., 46207 → 2026-07-04)
 *  - DD-MM-YYYY strings (e.g., "16-07-2026")
 *  - M/D/YY strings (e.g., "7/31/26")
 *  - Multi-value dates (e.g., "16-07-2026,\r\n29-07-2026" → takes first)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excelSerialToISO = excelSerialToISO;
exports.parseDate = parseDate;
exports.parseBoolean = parseBoolean;
exports.normalizeStatus = normalizeStatus;
exports.normalizeString = normalizeString;
exports.normalizeProject = normalizeProject;
exports.normalizeLocation = normalizeLocation;
exports.normalizeDiscipline = normalizeDiscipline;
exports.normalizeCategory = normalizeCategory;
exports.deriveTitle = deriveTitle;
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
dayjs_1.default.extend(customParseFormat_1.default);
// ─── Excel Serial → ISO Date ─────────────────────────────────────────────────
/**
 * Convert an Excel serial number to ISO 8601 date string (YYYY-MM-DD).
 * Accounts for the Lotus 1-2-3 leap year bug where serial 60 maps
 * to the non-existent Feb 29, 1900.
 */
function excelSerialToISO(serial) {
    if (!Number.isFinite(serial) || serial < 1)
        return null;
    // Adjust for the Lotus 1-2-3 bug: serials > 60 are off by 1
    const adjusted = serial > 60 ? serial - 1 : serial;
    const msPerDay = 86_400_000;
    const baseDate = Date.UTC(1900, 0, 1); // Jan 1, 1900
    const ms = baseDate + (adjusted - 1) * msPerDay;
    const d = new Date(ms);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// ─── Multi-Format Date Parser ────────────────────────────────────────────────
/**
 * Parse a date value that may be:
 *  - A number (Excel serial)
 *  - A numeric string ("46207")
 *  - DD-MM-YYYY ("16-07-2026")
 *  - M/D/YY ("7/31/26")
 *  - Multi-value ("16-07-2026,\r\n29-07-2026") → takes first
 *  - null/undefined/empty → returns null
 */
function parseDate(value) {
    if (value === null || value === undefined)
        return null;
    // If it's already a Date object (from XLSX cellDates option)
    if (value instanceof Date) {
        return (0, dayjs_1.default)(value).format('YYYY-MM-DD');
    }
    // Numeric → Excel serial
    if (typeof value === 'number') {
        return excelSerialToISO(value);
    }
    const str = String(value).trim();
    if (str === '')
        return null;
    // Numeric string → Excel serial
    if (/^\d+$/.test(str)) {
        return excelSerialToISO(Number(str));
    }
    // Multi-value: split on comma or newline, take the first
    if (str.includes(',') || str.includes('\n')) {
        const first = str.split(/[,\r\n]+/)[0].trim();
        return parseDate(first);
    }
    // DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyy) {
        const parsed = (0, dayjs_1.default)(str, 'DD-MM-YYYY', true);
        if (parsed.isValid())
            return parsed.format('YYYY-MM-DD');
        // Manual fallback
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }
    // M/D/YY or MM/DD/YY
    const mdyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mdyy) {
        const year = `20${mdyy[3]}`;
        return `${year}-${mdyy[1].padStart(2, '0')}-${mdyy[2].padStart(2, '0')}`;
    }
    // YYYY-MM-DD (already ISO)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    return null;
}
// ─── Boolean Normalization ───────────────────────────────────────────────────
/**
 * Normalize a "Yes"/"No"/empty/null value to a boolean.
 */
function parseBoolean(value) {
    if (value === null || value === undefined)
        return false;
    const str = String(value).trim().toLowerCase();
    return str === 'yes' || str === 'true' || str === '1';
}
// ─── Status Normalization ────────────────────────────────────────────────────
const STATUS_MAP = {
    'open': 'Open',
    'closed': 'Closed',
    'withdrawn': 'Withdrawn',
};
/**
 * Normalize status string to one of: Open, Closed, Withdrawn.
 * Returns 'Open' as default if unknown.
 */
function normalizeStatus(value) {
    if (value === null || value === undefined)
        return 'Open';
    const str = String(value).trim().toLowerCase();
    return STATUS_MAP[str] ?? 'Open';
}
// ─── String Normalization ────────────────────────────────────────────────────
/**
 * Trim and normalize whitespace in a string. Returns undefined for empty/null.
 */
function normalizeString(value) {
    if (value === null || value === undefined)
        return undefined;
    const str = String(value).trim();
    return str === '' ? undefined : str;
}
/**
 * Normalize project name to consistent format.
 */
function normalizeProject(value, fallback) {
    if (value === null || value === undefined)
        return fallback;
    const str = String(value).trim();
    if (str === '')
        return fallback;
    const lower = str.toLowerCase();
    if (lower === 'dorra')
        return 'Dorra';
    if (lower === 'crpo160' || lower === 'crpo-160')
        return 'CRPO-160';
    return str;
}
/**
 * Normalize location to title case.
 */
function normalizeLocation(value, fallback) {
    if (value === null || value === undefined)
        return fallback;
    const str = String(value).trim();
    if (str === '')
        return fallback;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
/**
 * Normalize discipline (trim whitespace inconsistencies).
 */
function normalizeDiscipline(value) {
    if (value === null || value === undefined)
        return undefined;
    const str = String(value).trim();
    if (str === '')
        return undefined;
    // Fix case: " Mechanical " → "Mechanical"
    return str.replace(/\s+/g, ' ').trim();
}
/**
 * Normalize category (handle typos like "Catrgory").
 * The column name is already handled in config; this normalizes the value.
 */
function normalizeCategory(value) {
    if (value === null || value === undefined)
        return undefined;
    const str = String(value).trim();
    if (str === '')
        return undefined;
    const lower = str.toLowerCase();
    if (lower === 'minor')
        return 'Minor';
    if (lower === 'moderate')
        return 'Moderate';
    if (lower === 'major')
        return 'Major';
    if (lower === 'critical')
        return 'Critical';
    return str;
}
/**
 * Derive a short notification title from a long NCR description.
 * Used when the INCR file has no separate Title column (e.g., Dorra INCR).
 */
function deriveTitle(description) {
    if (!description || description.trim() === '')
        return 'Untitled';
    const cleaned = description.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
    // If description starts with date/location preamble, try to extract the finding
    const preambleMatch = cleaned.match(/^(?:On\s+\d{1,2}[\s-]\w{3,}[\s-]\d{4},?\s*)?(?:during\s+.*?,\s*)?(?:it\s+was\s+observed\s+that\s+)?(.+)/i);
    let title = preambleMatch ? preambleMatch[1] : cleaned;
    // Truncate at first period or 120 chars
    const periodIdx = title.indexOf('.');
    if (periodIdx > 0 && periodIdx < 120) {
        title = title.substring(0, periodIdx);
    }
    else if (title.length > 120) {
        title = title.substring(0, 117) + '...';
    }
    return title.charAt(0).toUpperCase() + title.slice(1);
}
//# sourceMappingURL=normalize.js.map