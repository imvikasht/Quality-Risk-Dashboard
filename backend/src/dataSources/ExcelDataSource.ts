import { DataSource } from './DataSource';
import { QualityRecord } from '../types/quality';
import { readAllExcelFiles } from '../parsers/excelReader';
import { normalizeAllSheets } from '../parsers/dataNormalizer';
import { FILE_CONFIGS } from '../config/fileConfigs';

export class ExcelDataSource implements DataSource {
  constructor(private dataDir: string) {}

  async loadRecords(): Promise<QualityRecord[]> {
    // Read raw data from Excel files
    const parsed = readAllExcelFiles(this.dataDir, FILE_CONFIGS);
    
    // Normalize according to file configurations
    const { records, errors } = normalizeAllSheets(parsed);

    if (errors.length > 0) {
      console.warn(`[ExcelDataSource] ${errors.length} normalization warning(s) occurred.`);
    }

    return records;
  }
}
