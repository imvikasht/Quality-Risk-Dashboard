/**
 * Records Controller — handles HTTP request/response for quality record endpoints.
 */

import { Request, Response } from 'express';
import { dataService } from '../services/dataService';
import { ApiResponse, ApiError, QualityRecordWithRisk, DashboardSummary } from '../types/quality';

/**
 * GET /api/records
 * Returns all records with optional filters.
 */
export async function getRecords(req: Request, res: Response): Promise<void> {
  try {
    const filters = {
      project: req.query.project as string | undefined,
      status: req.query.status as string | undefined,
      recordType: req.query.recordType as string | undefined,
      discipline: req.query.discipline as string | undefined,
      riskLevel: req.query.riskLevel as string | undefined,
      repeatViolation: req.query.repeatViolation !== undefined
        ? req.query.repeatViolation === 'true'
        : undefined,
      search: req.query.search as string | undefined,
    };

    const records = await dataService.getRecords(filters);

    const response: ApiResponse<QualityRecordWithRisk[]> = {
      success: true,
      data: records,
      meta: {
        total: records.length,
      },
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RecordsController] Error fetching records:', message);
    const err: ApiError = {
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
export async function getRecordById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const record = await dataService.getRecordById(id);

    if (!record) {
      const err: ApiError = {
        success: false,
        error: 'Record not found',
        details: `No record found with ID: ${id}`,
      };
      res.status(404).json(err);
      return;
    }

    const response: ApiResponse<QualityRecordWithRisk> = {
      success: true,
      data: record,
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RecordsController] Error fetching record:', message);
    const err: ApiError = {
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
export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const filters = {
      project: req.query.project as string | undefined,
    };
    const summary = await dataService.getSummary(filters);

    const response: ApiResponse<DashboardSummary> = {
      success: true,
      data: summary,
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RecordsController] Error fetching summary:', message);
    const err: ApiError = {
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
export async function refreshData(req: Request, res: Response): Promise<void> {
  try {
    const result = await dataService.refresh();

    const response: ApiResponse<{ recordCount: number; loadTime: string }> = {
      success: true,
      data: {
        recordCount: result.recordCount,
        loadTime: result.loadTime.toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RecordsController] Error refreshing data:', message);
    const err: ApiError = {
      success: false,
      error: 'Failed to refresh data',
      details: message,
    };
    res.status(500).json(err);
  }
}
