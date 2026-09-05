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
import { AlertTriangle, CheckCircle2, Clock, FileWarning, ShieldAlert, Filter, Search, Download } from 'lucide-react';
import { exportRecordsToCSV } from '../utils/exportUtils';
import { RecordDetailsModal } from '../components/RecordDetailsModal';
import type { QualityRecordWithRisk } from '../types/quality';
import { toast } from 'react-hot-toast';

export const DashboardHome: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<{ type: string; value: string } | null>(null);
  const [kpiRecords, setKpiRecords] = useState<any[]>([]);
  const [loadingKpiRecords, setLoadingKpiRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<QualityRecordWithRisk | null>(null);

  const isCustomList = selectedKpi !== null || chartFilter !== null;
  const displayedRecords = (isCustomList ? kpiRecords : (summary?.recentRecords || []))
    .filter(record => {
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(
          (record.referenceNumber || '').toLowerCase().includes(q) ||
          (record.notificationTitle || '').toLowerCase().includes(q) ||
          (record.project || '').toLowerCase().includes(q)
        )) {
          return false;
        }
      }
      
      // Chart filter
      if (chartFilter) {
        if (chartFilter.type === 'project' && record.project !== chartFilter.value) return false;
        if (chartFilter.type === 'risk' && record.riskLevel !== chartFilter.value) return false;
        if (chartFilter.type === 'discipline' && (record.discipline || 'Unspecified') !== chartFilter.value) return false;
        if (chartFilter.type === 'category' && (record.category || 'Uncategorized') !== chartFilter.value) return false;
      }
      
      return true;
    });

  const loadDashboardData = async (isManualRefresh = false) => {
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
      
      if (isManualRefresh) {
        toast.success("Dashboard data refreshed successfully!");
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      if (isManualRefresh) {
        toast.error("Failed to refresh dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedKpi(null);
    setChartFilter(null);
    setKpiRecords([]);
    loadDashboardData();
  }, [selectedProject]);

  useEffect(() => {
    const handleRefreshed = () => {
      loadDashboardData(true);
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

  const handleKpiClick = async (kpiType: string) => {
    if (selectedKpi === kpiType) {
      setSelectedKpi(null);
      setKpiRecords([]);
      return;
    }
    
    setSelectedKpi(kpiType);
    setLoadingKpiRecords(true);
    
    try {
      // First we can just fetch all records for the selected project and filter locally
      // This is simple and works for all types of KPIs
      const records = await api.getRecords({ project: selectedProject || undefined });
      
      let filtered = records;
      
      switch (kpiType) {
        case 'Total Open':
          filtered = records.filter(r => r.status === 'Open');
          break;
        case 'Closed':
          filtered = records.filter(r => r.status === 'Closed');
          break;
        case 'Overdue ACD':
          filtered = records.filter(r => r.isOverdue);
          break;
        case 'Repeat Violations':
          filtered = records.filter(r => r.repeatViolation);
          break;
        case 'High/Critical Risk':
          filtered = records.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical');
          break;
      }
      
      setKpiRecords(filtered);
      
      // Smooth scroll to the table
      setTimeout(() => {
        document.getElementById('records-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('Failed to fetch KPI records', error);
    } finally {
      setLoadingKpiRecords(false);
    }
  };

  const handleChartClick = async (type: string, value: string) => {
    if (chartFilter?.type === type && chartFilter.value === value) {
      setChartFilter(null);
    } else {
      setChartFilter({ type, value });
      
      if (kpiRecords.length === 0) {
        setLoadingKpiRecords(true);
        try {
          const records = await api.getRecords({ project: selectedProject || undefined });
          setKpiRecords(records);
        } catch (error) {
          console.error('Failed to fetch records for chart filter', error);
        } finally {
          setLoadingKpiRecords(false);
        }
      }
      
      setTimeout(() => {
        document.getElementById('records-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

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
          onClick={() => handleKpiClick('Total Open')}
          selected={selectedKpi === 'Total Open'}
        />
        <KpiCard 
          title="Repeat Violations" 
          value={summary.repeatViolations} 
          icon={AlertTriangle} 
          color="text-orange-500"
          onClick={() => handleKpiClick('Repeat Violations')}
          selected={selectedKpi === 'Repeat Violations'}
        />
        <KpiCard 
          title="Overdue ACD" 
          value={summary.overdueRecords} 
          icon={Clock} 
          color="text-red-500"
          onClick={() => handleKpiClick('Overdue ACD')}
          selected={selectedKpi === 'Overdue ACD'}
        />
        <KpiCard 
          title="High/Critical Risk" 
          value={(summary.byRiskLevel['High'] || 0) + (summary.byRiskLevel['Critical'] || 0)} 
          icon={ShieldAlert} 
          color="text-red-600"
          onClick={() => handleKpiClick('High/Critical Risk')}
          selected={selectedKpi === 'High/Critical Risk'}
        />
        <KpiCard 
          title="Closed" 
          value={summary.closedRecords} 
          icon={CheckCircle2} 
          color="text-green-500"
          onClick={() => handleKpiClick('Closed')}
          selected={selectedKpi === 'Closed'}
        />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NcrTrendChart data={trends} />
        </div>
        <div>
          <RiskDistributionChart data={riskData} onChartClick={(val) => handleChartClick('risk', val)} />
        </div>
      </div>
      
      {/* Secondary Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProjectDistributionChart data={summary.byProject} onChartClick={(val) => handleChartClick('project', val)} />
        <DisciplineAnalysisChart data={summary.byDiscipline} onChartClick={(val) => handleChartClick('discipline', val)} />
        <CategoryBreakdownChart data={summary.byCategory} onChartClick={(val) => handleChartClick('category', val)} />
      </div>

      {/* Recent or Filtered Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" id="records-table">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {chartFilter 
                ? `${chartFilter.value} Records`
                : selectedKpi 
                  ? `${selectedKpi} Records ${selectedProject ? `(${selectedProject})` : ''}` 
                  : selectedProject ? `Recent Records - ${selectedProject}` : 'Recent Quality Records'}
            </h3>
            {(selectedKpi || chartFilter) && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                {displayedRecords.length} Records found
              </span>
            )}
            {chartFilter && (
              <button 
                onClick={() => setChartFilter(null)}
                className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors border border-red-200 ml-2"
              >
                Clear Chart Filter
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
            <button
              onClick={() => exportRecordsToCSV(displayedRecords, `Quality_Records_${selectedProject || 'All'}.csv`)}
              disabled={displayedRecords.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
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
              {loadingKpiRecords ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No records found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecordForDetails(record)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
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
      
      <RecordDetailsModal 
        isOpen={!!selectedRecordForDetails} 
        onClose={() => setSelectedRecordForDetails(null)} 
        record={selectedRecordForDetails} 
      />
    </div>
  );
};
