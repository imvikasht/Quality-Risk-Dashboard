import { google } from 'googleapis';
import { DataSource } from './DataSource';
import { QualityRecord } from '../types/quality';
import { normalizeAllSheets } from '../parsers/dataNormalizer';
import { ParsedSheet } from '../parsers/excelReader';
import { FILE_CONFIGS } from '../config/fileConfigs';

export class GoogleSheetsDataSource implements DataSource {
  private sheetsService: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
    
    // Use Service Account credentials from environment variables
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!this.spreadsheetId || !clientEmail || !privateKey) {
      console.warn('[GoogleSheetsDataSource] Missing required Google Sheets configuration in environment variables.');
    } else {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheetsService = google.sheets({ version: 'v4', auth });
    }
  }

  async loadRecords(): Promise<QualityRecord[]> {
    if (!this.sheetsService) {
      throw new Error('Google Sheets is not configured properly.');
    }

    const parsedSheets: ParsedSheet[] = [];

    for (const config of FILE_CONFIGS) {
      try {
        const response = await this.sheetsService.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${config.sheetName}!A1:Z1000`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
          console.warn(`[GoogleSheetsDataSource] No data found in sheet: ${config.sheetName}`);
          continue;
        }

        const headersList = rows[config.headerRow];
        const headers: Record<number, string> = {};
        if (headersList) {
          headersList.forEach((h: string, idx: number) => {
            if (h) headers[idx] = String(h).trim();
          });
        }

        const dataRows = rows.slice(config.headerRow + 1);

        const rawRows = dataRows.map((rowArr: any[]) => {
          const rowObj: Record<string, unknown> = {};
          Object.entries(headers).forEach(([colIdxStr, headerName]) => {
            const colIdx = Number(colIdxStr);
            rowObj[headerName] = rowArr[colIdx] ?? null;
          });
          return rowObj;
        });

        parsedSheets.push({
          config,
          headers,
          rows: rawRows,
          errors: [],
        });

      } catch (error: any) {
        console.error(`[GoogleSheetsDataSource] Error reading sheet ${config.sheetName}:`, error.message);
      }
    }

    // Reuse the exact same normalizer used by the Excel source
    const { records, errors } = normalizeAllSheets(parsedSheets);

    if (errors.length > 0) {
      console.warn(`[GoogleSheetsDataSource] ${errors.length} normalization warning(s) occurred.`);
    }

    return records;
  }
}
