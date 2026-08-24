import { DataSource } from './DataSource';
import { QualityRecord } from '../types/quality';
export declare class ExcelDataSource implements DataSource {
    private dataDir;
    constructor(dataDir: string);
    loadRecords(): Promise<QualityRecord[]>;
}
//# sourceMappingURL=ExcelDataSource.d.ts.map