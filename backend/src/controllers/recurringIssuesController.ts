import { Request, Response } from 'express';
import { dataService } from '../services/dataService';

export async function getRecurringIssues(req: Request, res: Response) {
  try {
    const issues = await dataService.getRecurringIssues();
    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch recurring issues' });
  }
}
