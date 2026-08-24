import { Request, Response } from 'express';
import { dataService } from '../services/dataService';

export async function getNotifications(req: Request, res: Response) {
  try {
    const includeReviewed = req.query.includeReviewed === 'true';
    const notifications = await dataService.getNotifications(includeReviewed);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

export async function getNotificationById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const notification = await dataService.getNotificationById(id);
    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notification' });
  }
}

export async function markNotificationReviewed(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const success = await dataService.markNotificationReviewed(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: { reviewed: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to review notification' });
  }
}
