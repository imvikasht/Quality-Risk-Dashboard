import axios from 'axios';
import type { QualityRecordWithRisk, DashboardSummary } from '../types/quality';
import type { Notification, RecurringIssueGroup } from '../types/notification';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // --- Dashboard ---
  getSummary: async (project?: string): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary', { params: { project } });
    return res.data.data;
  },
  
  getTrends: async () => {
    const res = await apiClient.get('/dashboard/trends');
    return res.data.data;
  },
  
  getRiskDistribution: async () => {
    const res = await apiClient.get('/dashboard/risk');
    return res.data.data;
  },

  // --- Records ---
  getRecords: async (filters?: any): Promise<QualityRecordWithRisk[]> => {
    const res = await apiClient.get('/records', { params: filters });
    return res.data.data;
  },
  
  getRecordById: async (id: string): Promise<QualityRecordWithRisk> => {
    const res = await apiClient.get(`/records/${id}`);
    return res.data.data;
  },

  // --- Notifications ---
  getNotifications: async (includeReviewed = false): Promise<Notification[]> => {
    const res = await apiClient.get('/notifications', { params: { includeReviewed } });
    return res.data.data;
  },
  
  markNotificationReviewed: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/review`);
  },

  // --- Recurring Issues ---
  getRecurringIssues: async (): Promise<RecurringIssueGroup[]> => {
    const res = await apiClient.get('/recurring-issues');
    return res.data.data;
  },
  
  // --- Metadata ---
  getProjects: async () => {
    const res = await apiClient.get('/projects');
    return res.data.data;
  },
  
  getCategories: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data;
  },
  
  refreshData: async () => {
    const res = await apiClient.get('/refresh');
    return res.data.data;
  }
};
