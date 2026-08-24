import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { QualityRecordWithRisk } from '../types/quality';
import { RiskBadge } from '../components/RiskBadge';
import { Search, Filter, Download } from 'lucide-react';

export const RecordExplorer: React.FC = () => {
  const [records, setRecords] = useState<QualityRecordWithRisk[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  // Options
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchData();

    const handleRefreshed = () => {
      fetchData();
    };

    window.addEventListener('dataRefreshed', handleRefreshed);
    return () => window.removeEventListener('dataRefreshed', handleRefreshed);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recs, projs] = await Promise.all([
        api.getRecords(),
        api.getProjects()
      ]);
      setRecords(recs);
      setProjects(projs);
    } catch (error) {
      console.error('Failed to fetch records', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.notificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? record.status === statusFilter : true;
    const matchesProject = projectFilter ? record.project === projectFilter : true;
    const matchesRisk = riskFilter ? record.riskLevel === riskFilter : true;
    
    return matchesSearch && matchesStatus && matchesProject && matchesRisk;
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Record Explorer</h1>
        <p className="text-gray-500 mt-1">Search and filter all normalized quality records.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            placeholder="Search by Title, Subject, or LBE/INCR No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="">All Risks</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="h-4 w-4 mr-2 text-gray-400" />
            Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Risk</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">LBE/INCR</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Repeat</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">ACD</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Loading records...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium text-gray-900">No records found</p>
                    <p className="mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr onClick={() => toggleRow(record.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RiskBadge level={record.riskLevel} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {record.referenceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.project}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-sm truncate" title={record.notificationTitle}>
                        {record.notificationTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide
                          ${record.status === 'Open' ? 'bg-blue-100 text-blue-800' : 
                            record.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.repeatViolation ? (
                          <span className="inline-flex items-center text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Yes</span>
                        ) : (
                          <span>No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {record.acd || '-'}
                      </td>
                    </tr>
                    {expandedId === record.id && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={8} className="px-6 py-4 border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {Object.entries(record).map(([key, value]) => {
                              if (typeof value === 'object') return null;
                              return (
                                <div key={key} className="flex flex-col">
                                  <span className="text-gray-500 text-xs font-semibold uppercase">{key}</span>
                                  <span className="text-gray-900 break-words">{String(value) || '-'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Simplified) */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 shrink-0">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredRecords.length > 0 ? 1 : 0}</span> to <span className="font-medium">{filteredRecords.length}</span> of <span className="font-medium">{records.length}</span> results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
