import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DashboardSummary } from '../types/quality';
import { KpiCard } from '../components/KpiCard';
import { NcrTrendChart } from '../components/NcrTrendChart';
import { RiskDistributionChart } from '../components/RiskDistributionChart';
import { ProjectDistributionChart } from '../components/ProjectDistributionChart';
import { DisciplineAnalysisChart } from '../components/DisciplineAnalysisChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import { RiskBadge } from '../components/RiskBadge';
import { AlertTriangle, CheckCircle2, Clock, FileWarning, ShieldAlert, Filter } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sum, trnd, rsk, projs] = await Promise.all([
        api.getSummary(selectedProject || undefined),
        api.getTrends(), // Note: Trends and Risk Distribution might not be filtered by project yet unless we update them too. For now, they show overall context if not updated on backend.
        api.getRiskDistribution(),
        api.getProjects()
      ]);
      setSummary(sum);
      setTrends(trnd);
      setRiskData(rsk);
      setProjects(projs);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedProject]);

  useEffect(() => {
    const handleRefreshed = () => {
      loadDashboardData();
    };

    window.addEventListener('dataRefreshed', handleRefreshed);
    return () => window.removeEventListener('dataRefreshed', handleRefreshed);
  }, [selectedProject]);

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Risk Dashboard</h1>
        
        <div className="flex items-center gap-4">
          {/* Project Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-sm border-none focus:ring-0 bg-transparent text-gray-700 font-medium cursor-pointer outline-none"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            Total Records: <span className="font-semibold text-gray-900">{summary.totalRecords}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard 
          title="Total Open" 
          value={summary.openRecords} 
          icon={FileWarning} 
          color="text-blue-600"
        />
        <KpiCard 
          title="Repeat Violations" 
          value={summary.repeatViolations} 
          icon={AlertTriangle} 
          color="text-orange-500"
        />
        <KpiCard 
          title="Overdue ACD" 
          value={summary.overdueRecords} 
          icon={Clock} 
          color="text-red-500"
        />
        <KpiCard 
          title="High/Critical Risk" 
          value={(summary.byRiskLevel['High'] || 0) + (summary.byRiskLevel['Critical'] || 0)} 
          icon={ShieldAlert} 
          color="text-red-600"
        />
        <KpiCard 
          title="Closed" 
          value={summary.closedRecords} 
          icon={CheckCircle2} 
          color="text-green-500"
        />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NcrTrendChart data={trends} />
        </div>
        <div>
          <RiskDistributionChart data={riskData} />
        </div>
      </div>
      
      {/* Secondary Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProjectDistributionChart data={summary.byProject} />
        <DisciplineAnalysisChart data={summary.byDiscipline} />
        <CategoryBreakdownChart data={summary.byCategory} />
      </div>

      {/* Recent High Risk Issues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedProject ? `Recent Records - ${selectedProject}` : 'Recent Quality Records'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No records found for the selected filter.
                  </td>
                </tr>
              ) : (
                summary.recentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.referenceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.project}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={record.notificationTitle}>
                      {record.notificationTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskBadge level={record.riskLevel} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${record.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.issuedDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
