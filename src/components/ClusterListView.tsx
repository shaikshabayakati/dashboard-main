'use client';

import React, { useState } from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import ReportCard from './ReportCard';

interface ClusterListViewProps {
  reports: PotholeReport[];
  onClose: () => void;
  onZoomToCluster?: () => void;
}

const ClusterListView: React.FC<ClusterListViewProps> = ({ reports, onClose, onZoomToCluster }) => {
  const [sortBy, setSortBy] = useState<'severity' | 'timestamp'>('severity');

  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'severity') {
      return b.severity - a.severity;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const avgSeverity = reports.reduce((sum, r) => sum + r.severity, 0) / reports.length;
  const statusCounts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold">Reports in this area</h2>
            <p className="text-sm text-blue-100">{reports.length} total reports</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-blue-100">Avg Severity</div>
            <div className="font-bold text-lg">{avgSeverity.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-blue-100">New Reports</div>
            <div className="font-bold text-lg">{statusCounts.new || 0}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'severity' | 'timestamp')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="severity">Severity (High to Low)</option>
            <option value="timestamp">Most Recent</option>
          </select>
        </div>
        {onZoomToCluster && (
          <button
            onClick={onZoomToCluster}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Zoom to Cluster
          </button>
        )}
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedReports.map((report) => (
          <ReportCard key={report.id} report={report} isExpanded={false} />
        ))}
      </div>
    </div>
  );
};

export default ClusterListView;
