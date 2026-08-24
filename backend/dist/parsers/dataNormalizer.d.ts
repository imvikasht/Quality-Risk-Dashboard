/**
 * Data Normalizer — transforms raw Excel rows into QualityRecord objects.
 *
 * Responsibilities:
 *  - Map source column names to QualityRecord fields using FileParsingConfig
 *  - Normalize dates, booleans, statuses, categories
 *  - Derive titles for INCR records without a Title column
 *  - Generate unique IDs
 *  - Log (but don't crash on) malformed rows
 */
import { QualityRecord } from '../types/quality';
import { ParsedSheet } from './excelReader';
interface NormalizationResult {
    records: QualityRecord[];
    errors: Array<{
        file: string;
        row: number;
        field?: string;
        message: string;
        rawValue?: unknown;
    }>;
}
/**
 * Normalize all parsed sheets into QualityRecords.
 */
export declare function normalizeAllSheets(parsedSheets: ParsedSheet[]): NormalizationResult;
export {};
//# sourceMappingURL=dataNormalizer.d.ts.map