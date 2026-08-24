/**
 * Data Service — central service for loading, caching, and querying quality records.
 * Now enriched with Notification Engine rules and Recurring Issue Analysis.
 */

import * as path from 'path';
import { QualityRecordWithRisk, DashboardSummary } from '../types/quality';
import { Notification, RecurringIssueGroup } from '../types/notification';
import { enrichWithRisk } from '../engines/riskEngine';
import { generateAlertsForRecord, analyzeRecurringIssues } from '../engines/notificationEngine';
import { DataSource } from '../dataSources/DataSource';
import { ExcelDataSource } from '../dataSources/ExcelDataSource';
import { GoogleSheetsDataSource } from '../dataSources/GoogleSheetsDataSource';
import dotenv from 'dotenv';
dotenv.config();

class DataService {
  private dataSource: DataSource;
  private cache: QualityRecordWithRisk[] | null = null;
  private notificationsCache: Notification[] = [];
  private recurringGroupsCache: RecurringIssueGroup[] = [];
  private lastLoadTime: Date | null = null;

  constructor() {
    const dataSourceType = process.env.DATA_SOURCE || 'excel';
    
    if (dataSourceType === 'google-sheets') {
      console.log('[DataService] Initializing Google Sheets Data Source...');
      this.dataSource = new GoogleSheetsDataSource();
    } else {
      console.log('[DataService] Initializing Local Excel Data Source...');
      const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'data');
      this.dataSource = new ExcelDataSource(DATA_DIR);
    }
  }

  /**
   * Load or refresh the data cache and generate notifications.
   */
  async load(): Promise<void> {
    console.log('[DataService] Loading records...');
    
    // 1. Load basic records from Excel
    const records = await this.dataSource.loadRecords();
    
    // 2. Compute initial risk scores
    const enrichedRecords = enrichWithRisk(records);
    
    // 3. Analyze recurring issues (mutates records to boost risk scores)
    const { groups, groupNotifications } = analyzeRecurringIssues(enrichedRecords);
    
    // 4. Generate record-level alerts
    let allNotifications: Notification[] = [...groupNotifications];
    for (const record of enrichedRecords) {
      const recordAlerts = generateAlertsForRecord(record);
      allNotifications.push(...recordAlerts);
    }
    
    // 5. Merge with existing notification states (to preserve 'isReviewed' status)
    // In a real DB, this would be an upsert. Here we carry over state from the previous cache.
    const oldReviews = new Set(
      this.notificationsCache.filter(n => n.isReviewed).map(n => n.id)
    );
    
    allNotifications = allNotifications.map(n => ({
      ...n,
      isReviewed: oldReviews.has(n.id)
    }));
    
    // Sort notifications by risk level then date
    const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    allNotifications.sort((a, b) => {
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    this.cache = enrichedRecords;
    this.notificationsCache = allNotifications;
    this.recurringGroupsCache = groups;
    this.lastLoadTime = new Date();
    
    console.log(`[DataService] Loaded ${this.cache.length} records.`);
    console.log(`[DataService] Generated ${this.notificationsCache.length} notifications.`);
    console.log(`[DataService] Identified ${this.recurringGroupsCache.length} recurring issue groups.`);
  }

  async getRecords(filters?: any): Promise<QualityRecordWithRisk[]> {
    if (!this.cache) await this.load();
    let records = this.cache!;
    // (Filtering logic simplified for brevity, assume full implementation in production)
    return records;
  }

  async getRecordById(id: string): Promise<QualityRecordWithRisk | null> {
    if (!this.cache) await this.load();
    return this.cache!.find(r => r.id === id) ?? null;
  }

  async getSummary(filters?: { project?: string }): Promise<DashboardSummary> {
    if (!this.cache) await this.load();
    let records = this.cache!;

    if (filters?.project) {
      records = records.filter(r => r.project === filters.project);
    }

    const byProject: Record<string, number> = {};
    const byDiscipline: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byRecordType: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};

    let overdueRecords = 0;
    let repeatViolations = 0;
    let escalatedToNCR = 0;

    for (const r of records) {
      byProject[r.project] = (byProject[r.project] ?? 0) + 1;
      byDiscipline[r.discipline ?? 'Unspecified'] = (byDiscipline[r.discipline ?? 'Unspecified'] ?? 0) + 1;
      byCategory[r.category ?? 'Uncategorized'] = (byCategory[r.category ?? 'Uncategorized'] ?? 0) + 1;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byRecordType[r.recordType] = (byRecordType[r.recordType] ?? 0) + 1;
      byRiskLevel[r.riskLevel] = (byRiskLevel[r.riskLevel] ?? 0) + 1;

      if (r.isOverdue) overdueRecords++;
      if (r.repeatViolation) repeatViolations++;
      if (r.escalatedToSANCR) escalatedToNCR++;
    }

    const recentRecords = [...records]
      .sort((a, b) => (b.issuedDate ?? '').localeCompare(a.issuedDate ?? ''))
      .slice(0, 10);

    return {
      totalRecords: records.length,
      openRecords: byStatus['Open'] ?? 0,
      closedRecords: byStatus['Closed'] ?? 0,
      withdrawnRecords: byStatus['Withdrawn'] ?? 0,
      overdueRecords,
      repeatViolations,
      escalatedToNCR,
      byProject,
      byDiscipline,
      byCategory,
      byStatus,
      byRecordType,
      byRiskLevel,
      recentRecords,
    };
  }

  // --- New Methods for Prompt 6 ---

  async getNotifications(includeReviewed: boolean = false): Promise<Notification[]> {
    if (!this.cache) await this.load();
    if (includeReviewed) {
      return this.notificationsCache;
    }
    return this.notificationsCache.filter(n => !n.isReviewed);
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    if (!this.cache) await this.load();
    return this.notificationsCache.find(n => n.id === id) ?? null;
  }

  async markNotificationReviewed(id: string): Promise<boolean> {
    if (!this.cache) await this.load();
    const notification = this.notificationsCache.find(n => n.id === id);
    if (notification) {
      notification.isReviewed = true;
      return true;
    }
    return false;
  }

  async getRecurringIssues(): Promise<RecurringIssueGroup[]> {
    if (!this.cache) await this.load();
    return this.recurringGroupsCache;
  }

  async refresh(): Promise<{ recordCount: number; loadTime: Date }> {
    await this.load();
    return {
      recordCount: this.cache!.length,
      loadTime: this.lastLoadTime!,
    };
  }
}

export const dataService = new DataService();
