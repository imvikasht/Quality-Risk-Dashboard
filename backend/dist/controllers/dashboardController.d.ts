import { Request, Response } from 'express';
/**
 * GET /api/dashboard/trends
 * Returns monthly NCR/quality trends
 */
export declare function getDashboardTrends(req: Request, res: Response): Promise<void>;
/**
 * GET /api/dashboard/risk
 * Returns the risk distribution
 */
export declare function getRiskDistribution(req: Request, res: Response): Promise<void>;
/**
 * GET /api/projects
 * Returns a list of all distinct projects and some basic stats for them
 */
export declare function getProjects(req: Request, res: Response): Promise<void>;
/**
 * GET /api/categories
 * Returns a list of all distinct categories
 */
export declare function getCategories(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=dashboardController.d.ts.map