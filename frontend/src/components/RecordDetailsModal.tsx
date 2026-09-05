import React from 'react';
import { X } from 'lucide-react';
import type { QualityRecordWithRisk } from '../types/quality';
import { RiskBadge } from './RiskBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: QualityRecordWithRisk | null;
}

export const RecordDetailsModal: React.FC<Props> = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-gray-900 bg-opacity-50 transition-opacity">
      {/* Click away overlay */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">{record.referenceNumber}</h2>
              <RiskBadge level={record.riskLevel} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                ${record.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {record.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{record.project}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Issue Description</h3>
            <p className="text-base font-medium text-gray-900">{record.notificationTitle}</p>
            {record.subject && record.subject !== record.notificationTitle && (
              <p className="text-sm text-gray-700 mt-2">{record.subject}</p>
            )}
            {record.failureAndEvidence && (
              <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm text-gray-800 border border-gray-100">
                <span className="font-semibold block mb-1">Failure & Evidence:</span>
                {record.failureAndEvidence}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Classification</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Record Type:</dt>
                    <dd className="font-medium text-gray-900">{record.recordType}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Discipline:</dt>
                    <dd className="font-medium text-gray-900">{record.discipline || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Category:</dt>
                    <dd className="font-medium text-gray-900">{record.category || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Timeline</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Issued Date:</dt>
                    <dd className="font-medium text-gray-900">{record.issuedDate || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Target Closure (ACD):</dt>
                    <dd className={`font-medium ${record.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {record.acd || 'N/A'} {record.isOverdue && '(Overdue)'}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <dt className="text-gray-500">Actual Closure:</dt>
                    <dd className="font-medium text-gray-900">{record.closingDate || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Corrective Actions Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Resolution Details</h3>
            <div className="space-y-4">
              {record.rootCause && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Root Cause</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{record.rootCause}</p>
                </div>
              )}
              {record.correctiveAction && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Corrective Action</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{record.correctiveAction}</p>
                </div>
              )}
              {record.preventiveAction && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Preventive Action</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{record.preventiveAction}</p>
                </div>
              )}
              {!record.rootCause && !record.correctiveAction && !record.preventiveAction && (
                <p className="text-sm text-gray-500 italic">No resolution details documented yet.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
