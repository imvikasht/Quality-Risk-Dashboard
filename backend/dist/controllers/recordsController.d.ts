/**
 * Records Controller — handles HTTP request/response for quality record endpoints.
 */
import { Request, Response } from 'express';
/**
 * GET /api/records
 * Returns all records with optional filters.
 */
export declare function getRecords(req: Request, res: Response): Promise<void>;
/**
 * GET /api/records/:id
 * Returns a single record by ID.
 */
export declare function getRecordById(req: Request, res: Response): Promise<void>;
/**
 * GET /api/summary
 * Returns dashboard summary statistics.
 */
export declare function getSummary(req: Request, res: Response): Promise<void>;
/**
 * GET /api/refresh
 * Force a data refresh from the data source.
 */
export declare function refreshData(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=recordsController.d.ts.map