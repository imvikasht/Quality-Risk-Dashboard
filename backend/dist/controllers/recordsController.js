"use strict";
/**
 * Records Controller — handles HTTP request/response for quality record endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecords = getRecords;
exports.getRecordById = getRecordById;
exports.getSummary = getSummary;
exports.refreshData = refreshData;
const dataService_1 = require("../services/dataService");
/**
 * GET /api/records
 * Returns all records with optional filters.
 */
async function getRecords(req, res) {
    try {
        const filters = {
            project: req.query.project,
            status: req.query.status,
            recordType: req.query.recordType,
            discipline: req.query.discipline,
            riskLevel: req.query.riskLevel,
            repeatViolation: req.query.repeatViolation !== undefined
                ? req.query.repeatViolation === 'true'
                : undefined,
            search: req.query.search,
        };
        const records = await dataService_1.dataService.getRecords(filters);
        const response = {
            success: true,
            data: records,
            meta: {
                total: records.length,
            },
        };
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[RecordsController] Error fetching records:', message);
        const err = {
            success: false,
            error: 'Failed to fetch records',
            details: message,
        };
        res.status(500).json(err);
    }
}
/**
 * GET /api/records/:id
 * Returns a single record by ID.
 */
async function getRecordById(req, res) {
    try {
        const id = req.params.id;
        const record = await dataService_1.dataService.getRecordById(id);
        if (!record) {
            const err = {
                success: false,
                error: 'Record not found',
                details: `No record found with ID: ${id}`,
            };
            res.status(404).json(err);
            return;
        }
        const response = {
            success: true,
            data: record,
        };
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[RecordsController] Error fetching record:', message);
        const err = {
            success: false,
            error: 'Failed to fetch record',
            details: message,
        };
        res.status(500).json(err);
    }
}
/**
 * GET /api/summary
 * Returns dashboard summary statistics.
 */
async function getSummary(req, res) {
    try {
        const summary = await dataService_1.dataService.getSummary();
        const response = {
            success: true,
            data: summary,
        };
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[RecordsController] Error fetching summary:', message);
        const err = {
            success: false,
            error: 'Failed to fetch summary',
            details: message,
        };
        res.status(500).json(err);
    }
}
/**
 * GET /api/refresh
 * Force a data refresh from the data source.
 */
async function refreshData(req, res) {
    try {
        const result = await dataService_1.dataService.refresh();
        const response = {
            success: true,
            data: {
                recordCount: result.recordCount,
                loadTime: result.loadTime.toISOString(),
            },
        };
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[RecordsController] Error refreshing data:', message);
        const err = {
            success: false,
            error: 'Failed to refresh data',
            details: message,
        };
        res.status(500).json(err);
    }
}
//# sourceMappingURL=recordsController.js.map