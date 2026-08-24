"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsDataSource = void 0;
const googleapis_1 = require("googleapis");
const dataNormalizer_1 = require("../parsers/dataNormalizer");
const fileConfigs_1 = require("../config/fileConfigs");
class GoogleSheetsDataSource {
    sheetsService;
    spreadsheetId;
    constructor() {
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
        // Use Service Account credentials from environment variables
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!this.spreadsheetId || !clientEmail || !privateKey) {
            console.warn('[GoogleSheetsDataSource] Missing required Google Sheets configuration in environment variables.');
        }
        else {
            const auth = new googleapis_1.google.auth.JWT({
                email: clientEmail,
                key: privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            this.sheetsService = googleapis_1.google.sheets({ version: 'v4', auth });
        }
    }
    async loadRecords() {
        if (!this.sheetsService) {
            throw new Error('Google Sheets is not configured properly.');
        }
        const parsedSheets = [];
        for (const config of fileConfigs_1.FILE_CONFIGS) {
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
                const headers = {};
                if (headersList) {
                    headersList.forEach((h, idx) => {
                        if (h)
                            headers[idx] = String(h).trim();
                    });
                }
                const dataRows = rows.slice(config.headerRow + 1);
                const rawRows = dataRows.map((rowArr) => {
                    const rowObj = {};
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
            }
            catch (error) {
                console.error(`[GoogleSheetsDataSource] Error reading sheet ${config.sheetName}:`, error.message);
            }
        }
        // Reuse the exact same normalizer used by the Excel source
        const { records, errors } = (0, dataNormalizer_1.normalizeAllSheets)(parsedSheets);
        if (errors.length > 0) {
            console.warn(`[GoogleSheetsDataSource] ${errors.length} normalization warning(s) occurred.`);
        }
        return records;
    }
}
exports.GoogleSheetsDataSource = GoogleSheetsDataSource;
//# sourceMappingURL=GoogleSheetsDataSource.js.map