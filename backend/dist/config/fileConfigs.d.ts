/**
 * File parsing configurations for each known Excel file.
 *
 * Each config tells the parser:
 *  - Which sheet to read
 *  - Which row contains headers (0-indexed)
 *  - How to map source column names → QualityRecord fields
 *  - Project/location metadata not present in the data rows
 */
import { FileParsingConfig } from '../types/quality';
export declare const FILE_CONFIGS: FileParsingConfig[];
/**
 * Try to find a matching config for a given filename.
 * Falls back to null if no config is found.
 */
export declare function findConfigForFile(fileName: string): FileParsingConfig | null;
//# sourceMappingURL=fileConfigs.d.ts.map