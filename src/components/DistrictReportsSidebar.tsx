'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import { useGeographic } from '@/contexts/GeographicContext';
import ReportCard from './ReportCard';
import { X, Filter } from 'lucide-react';

interface DistrictReportsSidebarProps {
  districtName: string;
  mandalName?: string | null;
  reports: PotholeReport[];
  onClose: () => void;
}

type SortOption = 'recent' | 'oldest' | 'severity-high' | 'severity-low';
type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

const DistrictReportsSidebar: React.FC<DistrictReportsSidebarProps> = ({ 
  districtName, 
  mandalName,
  reports,
  onClose 
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  
  const { setHighlightedDistrict, setHighlightedMandal } = useGeographic();

  // Set highlighting when sidebar opens
  useEffect(() => {
    if (mandalName) {
      setHighlightedMandal(mandalName);
      setHighlightedDistrict(districtName); // Also highlight the containing district
    } else {
      setHighlightedDistrict(districtName);
      setHighlightedMandal(null);
    }

    // Cleanup highlighting when sidebar closes
    return () => {
      setHighlightedDistrict(null);
      setHighlightedMandal(null);
    };
  }, [districtName, mandalName, setHighlightedDistrict, setHighlightedMandal]);

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(r => r.severityLabel === severityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'severity-high':
          return b.severity - a.severity;
        case 'severity-low':
          return a.severity - b.severity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reports, sortBy, severityFilter]);

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {mandalName ? mandalName : districtName}
          </h2>
          {mandalName && (
            <p className="text-xs text-gray-500">{districtName}</p>
          )}
          <p className="text-sm text-gray-700">
            {filteredAndSortedReports.length} of {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Filters Section */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
        {/* Sort By */}
        <div>
          <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
            <Filter className="w-3 h-3 mr-1" />
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="severity-high">Severity (High to Low)</option>
            <option value="severity-low">Severity (Low to High)</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block">
            Filter by Severity
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                severityFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('high')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                severityFilter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSeverityFilter('medium')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                severityFilter === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSeverityFilter('low')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                severityFilter === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Low
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAndSortedReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">
              {reports.length === 0 ? 'No reports in this district' : 'No reports match the filters'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {reports.length === 0 
                ? 'Reports will appear here when available'
                : 'Try adjusting your filters'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedReports.map((report) => (
            <div key={report.id} className="transform transition-transform hover:scale-[1.02]">
              <ReportCard report={report} isExpanded={false} />
            </div>
          ))
        )}
      </div>

      {/* Footer with summary */}
      {reports.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500">High</div>
              <div className="text-lg font-bold text-red-600">
                {reports.filter(r => r.severityLabel === 'high').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Medium</div>
              <div className="text-lg font-bold text-yellow-600">
                {reports.filter(r => r.severityLabel === 'medium').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Low</div>
              <div className="text-lg font-bold text-green-600">
                {reports.filter(r => r.severityLabel === 'low').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictReportsSidebar;
