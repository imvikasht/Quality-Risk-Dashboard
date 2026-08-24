import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RecurringIssueGroup } from '../types/notification';
import { RiskBadge } from '../components/RiskBadge';
import { Repeat, FolderOpen, Calendar, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RecurringIssues: React.FC = () => {
  const [groups, setGroups] = useState<RecurringIssueGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const data = await api.getRecurringIssues();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch recurring issues', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();

    const handleRefreshed = () => {
      fetchIssues();
    };

    window.addEventListener('dataRefreshed', handleRefreshed);
    return () => window.removeEventListener('dataRefreshed', handleRefreshed);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No recurring issues found</h3>
        <p className="mt-1 text-gray-500">The notification engine didn't detect any systemic quality patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recurring Issues Analysis</h1>
        <p className="text-gray-500 mt-1">Systemic quality problems grouped by semantic similarity.</p>
      </div>

      <div className="grid gap-6">
        {groups.map((group) => {
          
          // Prepare data for the mini trend chart
          // Group occurrences by month
          const trendMap = new Map<string, number>();
          group.relatedRecords.forEach(r => {
            if (r.issuedDate) {
              const month = r.issuedDate.substring(0, 7); // YYYY-MM
              trendMap.set(month, (trendMap.get(month) || 0) + 1);
            }
          });
          const trendData = Array.from(trendMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => ({ month, count }));

          return (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{group.groupName}</h2>
                    <RiskBadge level={group.aggregateRiskLevel} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">{group.occurrences}</span> occurrences
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-900">{group.projectsAffected.length}</span> projects affected
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-gray-900">{group.repeatViolations}</span> repeat violations
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Latest: <span className="font-medium text-gray-900">{group.latestOccurrence}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64 h-24 bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <Tooltip contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-gray-50/50 p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Related Records ({group.relatedRecords.length})</h3>
                <div className="space-y-3">
                  {group.relatedRecords.map((record: any) => (
                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">{record.referenceNumber}</span>
                          <span className="text-xs font-medium text-gray-400">{record.project}</span>
                          <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${record.status === 'Open' ? 'text-blue-700 bg-blue-50' : 'text-gray-500 bg-gray-100'}`}>{record.status}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate" title={record.notificationTitle}>{record.notificationTitle}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5" title={record.subject}>{record.subject}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Score</p>
                          <p className="text-sm font-bold text-gray-700">{record.riskScore}</p>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
