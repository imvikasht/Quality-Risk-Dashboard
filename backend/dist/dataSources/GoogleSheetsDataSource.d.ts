import { DataSource } from './DataSource';
import { QualityRecord } from '../types/quality';
export declare class GoogleSheetsDataSource implements DataSource {
    private sheetsService;
    private spreadsheetId;
    constructor();
    loadRecords(): Promise<QualityRecord[]>;
}
//# sourceMappingURL=GoogleSheetsDataSource.d.ts.map