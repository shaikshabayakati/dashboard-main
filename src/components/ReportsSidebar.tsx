'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { setHighlightedDistrict, setHighlightedMandal } = useGeographic();

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [sortBy, severityFilter, reports]);

  // Set highlighting when sidebar opens - maintain highlighting when closed
  useEffect(() => {
    if (isVisible) {
      if (mandalName) {
        setHighlightedMandal(mandalName);
        setHighlightedDistrict(districtName || null);
      } else if (districtName) {
        setHighlightedDistrict(districtName);
        setHighlightedMandal(null);
      }
    }
    // Note: Don't clear highlighting when sidebar closes to maintain map state
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

  // Infinite scroll logic
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 10);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredAndSortedReports.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [visibleCount, filteredAndSortedReports.length, loadMore]);

  // Get visible reports based on pagination
  const visibleReports = useMemo(() => {
    return filteredAndSortedReports.slice(0, visibleCount);
  }, [filteredAndSortedReports, visibleCount]);

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
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">
                {mandalName || districtName || 'Selected Area'}
              </h2>
            </div>
            {mandalName && districtName && (
              <p className="text-xs text-gray-600 mt-1">
                {districtName} District
              </p>
            )}
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  {filteredAndSortedReports.length} of {reports.length} Reports
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>



        {/* Enhanced Filters Section */}
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div>
            <label className="flex items-center text-xs font-medium text-gray-700 mb-2">
              <Filter className="w-3 h-3 mr-1 text-blue-600" />
              Sort & Filter
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-all duration-200"
            >
              <option value="recent">📅 Most Recent</option>
              <option value="oldest">⏰ Oldest First</option>
              <option value="severity-high">🔴 Severity (High to Low)</option>
              <option value="severity-low">🟢 Severity (Low to High)</option>
            </select>
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
            <>
              <div className="space-y-3 p-4">
                {visibleReports.map((report) => (
                  <div key={report.id} className="transform transition-transform hover:scale-[1.01]">
                    <ReportCard
                      report={report}
                      isExpanded={false}
                      onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
                    />
                  </div>
                ))}
              </div>
              {/* Infinite scroll observer */}
              {visibleCount < filteredAndSortedReports.length && (
                <div ref={observerRef} className="h-4 w-full" />
              )}
            </>
          )}
        </div>

        {/* Quick Stats at Bottom */}
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">Quick Stats:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-semibold">{severityCounts.high}</span>
                <span className="text-gray-500">H</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-600 font-semibold">{severityCounts.medium}</span>
                <span className="text-gray-500">M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">{severityCounts.low}</span>
                <span className="text-gray-500">L</span>
              </div>
              <div className="border-l border-gray-300 pl-3 ml-1">
                <span className="text-gray-700 font-semibold">{reports.length}</span>
                <span className="text-gray-500">Total</span>
              </div>
            </div>
          </div>
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