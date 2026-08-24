import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Clock, AlertOctagon, Repeat, ArrowRight } from 'lucide-react';
import { NotificationType } from '../types/notification';
import type { Notification } from '../types/notification';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose, notifications, onRefresh }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const handleReview = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.markNotificationReviewed(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark reviewed', err);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'border-red-500 bg-red-50 text-red-700';
      case 'High': return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'Medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'Low': return 'border-green-500 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-white text-gray-700';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.REPEAT_VIOLATION: return <Repeat className="w-5 h-5" />;
      case NotificationType.ESCALATED_NCR: return <AlertOctagon className="w-5 h-5" />;
      case NotificationType.OVERDUE_ACD: return <Clock className="w-5 h-5" />;
      case NotificationType.RECURRING_QUALITY_ISSUE: return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">{notifications.length} unread alerts</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up</h3>
              <p className="mt-1 text-sm text-gray-500">No new quality risks detected.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isExpanded = expandedId === notif.id;
              
              return (
                <div 
                  key={notif.id}
                  className={`relative overflow-hidden rounded-lg border-l-4 shadow-sm bg-white cursor-pointer transition-shadow hover:shadow-md ${getRiskColor(notif.riskLevel).split(' ')[0]}`}
                  onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`p-1.5 rounded-full ${getRiskColor(notif.riskLevel)}`}>
                          {getIcon(notif.type)}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${getRiskBadge(notif.riskLevel)}`}>
                            {notif.riskLevel}
                          </span>
                          <span className="ml-2 text-xs font-semibold text-gray-500 tracking-wider">
                            {notif.project} • {notif.referenceNumber}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">
                        {notif.reason}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 font-medium line-clamp-2">
                        {notif.notificationTitle}
                      </p>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject / Description</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{notif.subject}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="text-sm font-medium">{notif.category || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Discipline</p>
                            <p className="text-sm font-medium">{notif.discipline || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Risk Score</p>
                            <p className="text-sm font-medium">{notif.riskScore}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Source</p>
                            <p className="text-sm font-medium truncate" title={notif.sourceFile}>{notif.sourceFile}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Factors</p>
                          <ul className="space-y-1">
                            {notif.riskFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-start text-xs text-gray-600">
                                <span className="mr-2 text-gray-400">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                            onClick={(e) => { e.stopPropagation(); /* TODO: Navigate */ }}
                          >
                            View Full Record
                            <ArrowRight className="ml-1 w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => handleReview(e, notif.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4 text-gray-400" />
                            Mark as Reviewed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
