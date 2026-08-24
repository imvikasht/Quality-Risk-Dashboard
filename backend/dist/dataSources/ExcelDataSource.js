"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelDataSource = void 0;
const excelReader_1 = require("../parsers/excelReader");
const dataNormalizer_1 = require("../parsers/dataNormalizer");
const fileConfigs_1 = require("../config/fileConfigs");
class ExcelDataSource {
    dataDir;
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    async loadRecords() {
        // Read raw data from Excel files
        const parsed = (0, excelReader_1.readAllExcelFiles)(this.dataDir, fileConfigs_1.FILE_CONFIGS);
        // Normalize according to file configurations
        const { records, errors } = (0, dataNormalizer_1.normalizeAllSheets)(parsed);
        if (errors.length > 0) {
            console.warn(`[ExcelDataSource] ${errors.length} normalization warning(s) occurred.`);
        }
        return records;
    }
}
exports.ExcelDataSource = ExcelDataSource;
//# sourceMappingURL=ExcelDataSource.js.map