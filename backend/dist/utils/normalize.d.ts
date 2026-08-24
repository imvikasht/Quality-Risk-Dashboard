/**
 * Date and value normalization utilities.
 *
 * Handles the various date formats found in the Excel files:
 *  - Excel serial numbers (e.g., 46207 → 2026-07-04)
 *  - DD-MM-YYYY strings (e.g., "16-07-2026")
 *  - M/D/YY strings (e.g., "7/31/26")
 *  - Multi-value dates (e.g., "16-07-2026,\r\n29-07-2026" → takes first)
 */
/**
 * Convert an Excel serial number to ISO 8601 date string (YYYY-MM-DD).
 * Accounts for the Lotus 1-2-3 leap year bug where serial 60 maps
 * to the non-existent Feb 29, 1900.
 */
export declare function excelSerialToISO(serial: number): string | null;
/**
 * Parse a date value that may be:
 *  - A number (Excel serial)
 *  - A numeric string ("46207")
 *  - DD-MM-YYYY ("16-07-2026")
 *  - M/D/YY ("7/31/26")
 *  - Multi-value ("16-07-2026,\r\n29-07-2026") → takes first
 *  - null/undefined/empty → returns null
 */
export declare function parseDate(value: unknown): string | null;
/**
 * Normalize a "Yes"/"No"/empty/null value to a boolean.
 */
export declare function parseBoolean(value: unknown): boolean;
/**
 * Normalize status string to one of: Open, Closed, Withdrawn.
 * Returns 'Open' as default if unknown.
 */
export declare function normalizeStatus(value: unknown): 'Open' | 'Closed' | 'Withdrawn';
/**
 * Trim and normalize whitespace in a string. Returns undefined for empty/null.
 */
export declare function normalizeString(value: unknown): string | undefined;
/**
 * Normalize project name to consistent format.
 */
export declare function normalizeProject(value: unknown, fallback: string): string;
/**
 * Normalize location to title case.
 */
export declare function normalizeLocation(value: unknown, fallback: string): string;
/**
 * Normalize discipline (trim whitespace inconsistencies).
 */
export declare function normalizeDiscipline(value: unknown): string | undefined;
/**
 * Normalize category (handle typos like "Catrgory").
 * The column name is already handled in config; this normalizes the value.
 */
export declare function normalizeCategory(value: unknown): string | undefined;
/**
 * Derive a short notification title from a long NCR description.
 * Used when the INCR file has no separate Title column (e.g., Dorra INCR).
 */
export declare function deriveTitle(description: string): string;
//# sourceMappingURL=normalize.d.ts.map