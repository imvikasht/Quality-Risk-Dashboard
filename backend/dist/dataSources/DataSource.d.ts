import { QualityRecord } from '../types/quality';
export interface DataSource {
    /**
     * Loads and normalizes quality records from the underlying data source.
     */
    loadRecords(): Promise<QualityRecord[]>;
}
//# sourceMappingURL=DataSource.d.ts.map