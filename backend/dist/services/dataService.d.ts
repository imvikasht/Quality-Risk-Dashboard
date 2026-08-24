/**
 * Data Service — central service for loading, caching, and querying quality records.
 * Now enriched with Notification Engine rules and Recurring Issue Analysis.
 */
import { QualityRecordWithRisk, DashboardSummary } from '../types/quality';
import { Notification, RecurringIssueGroup } from '../types/notification';
declare class DataService {
    private dataSource;
    private cache;
    private notificationsCache;
    private recurringGroupsCache;
    private lastLoadTime;
    constructor();
    /**
     * Load or refresh the data cache and generate notifications.
     */
    load(): Promise<void>;
    getRecords(filters?: any): Promise<QualityRecordWithRisk[]>;
    getRecordById(id: string): Promise<QualityRecordWithRisk | null>;
    getSummary(): Promise<DashboardSummary>;
    getNotifications(includeReviewed?: boolean): Promise<Notification[]>;
    getNotificationById(id: string): Promise<Notification | null>;
    markNotificationReviewed(id: string): Promise<boolean>;
    getRecurringIssues(): Promise<RecurringIssueGroup[]>;
    refresh(): Promise<{
        recordCount: number;
        loadTime: Date;
    }>;
}
export declare const dataService: DataService;
export {};
//# sourceMappingURL=dataService.d.ts.map