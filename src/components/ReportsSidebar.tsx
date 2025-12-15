'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import { useGeographic } from '@/contexts/GeographicContext';
import ReportCard from './ReportCard';
import { X, Filter, MapPin, Calendar, AlertTriangle } from 'lucide-react';

interface ReportsSidebarProps {
  districtName?: string;
  mandalName?: string;
  reports: PotholeReport[];
  onClose: () => void;
  isVisible: boolean;
}

type SortOption = 'recent' | 'oldest' | 'severity-high' | 'severity-low';
type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

const ReportsSidebar: React.FC<ReportsSidebarProps> = ({ 
  districtName, 
  mandalName,
  reports,
  onClose,
  isVisible 
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { setHighlightedDistrict, setHighlightedMandal } = useGeographic();

  // Set highlighting when sidebar opens
  useEffect(() => {
    if (isVisible) {
      if (mandalName) {
        setHighlightedMandal(mandalName);
        setHighlightedDistrict(districtName || null);
      } else if (districtName) {
        setHighlightedDistrict(districtName);
        setHighlightedMandal(null);
      }
    } else {
      // Clear highlighting when sidebar closes
      setHighlightedDistrict(null);
      setHighlightedMandal(null);
    }
  }, [isVisible, districtName, mandalName, setHighlightedDistrict, setHighlightedMandal]);

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

  // Calculate severity counts
  const severityCounts = useMemo(() => {
    return {
      high: reports.filter(r => r.severityLabel === 'high').length,
      medium: reports.filter(r => r.severityLabel === 'medium').length,
      low: reports.filter(r => r.severityLabel === 'low').length
    };
  }, [reports]);

  if (!isVisible) return null;

  return (
    <>
      <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">
                {mandalName || districtName || 'Selected Area'}
              </h2>
            </div>
            {mandalName && districtName && (
              <p className="text-sm text-gray-600 mt-1">
                {districtName} District
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {filteredAndSortedReports.length} of {reports.length} Reports
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Severity Overview */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-red-600">{severityCounts.high}</div>
              <div className="text-xs text-gray-500">High</div>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{severityCounts.low}</div>
              <div className="text-xs text-gray-500">Low</div>
            </div>
          </div>
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
        <div className="flex-1 overflow-y-auto">
          {filteredAndSortedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-gray-400 mb-4">
                <AlertTriangle className="w-16 h-16" />
              </div>
              <p className="text-gray-500 font-medium text-center">
                {reports.length === 0 ? 'No reports in this area' : 'No reports match the filters'}
              </p>
              <p className="text-gray-400 text-sm text-center mt-2">
                {reports.length === 0 
                  ? 'Reports will appear here when available'
                  : 'Try adjusting your filters'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {filteredAndSortedReports.map((report) => (
                <div key={report.id} className="transform transition-transform hover:scale-[1.01]">
                  <ReportCard 
                    report={report} 
                    isExpanded={false}
                    onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-2xl transition-colors z-[110]"
            title="Close (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-7xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsSidebar;