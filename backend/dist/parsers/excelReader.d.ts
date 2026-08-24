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
 * Read and parse a single Excel file according to its config.
 */
export declare function readExcelFile(dataDir: string, config: FileParsingConfig): ParsedSheet;
/**
 * Discover and read all Excel files in the data directory.
 * Only processes files that have a matching FileParsingConfig.
 */
export declare function readAllExcelFiles(dataDir: string, configs: FileParsingConfig[]): ParsedSheet[];
//# sourceMappingURL=excelReader.d.ts.map