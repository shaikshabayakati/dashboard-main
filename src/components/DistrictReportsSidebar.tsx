'use client';

import React from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import ReportCard from './ReportCard';
import { X } from 'lucide-react';

interface DistrictReportsSidebarProps {
  districtName: string;
  reports: PotholeReport[];
  onClose: () => void;
}

const DistrictReportsSidebar: React.FC<DistrictReportsSidebarProps> = ({ 
  districtName, 
  reports,
  onClose 
}) => {
  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{districtName}</h2>
          <p className="text-sm text-gray-600">
            {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
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

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {reports.length === 0 ? (
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
            <p className="text-gray-500 font-medium">No reports in this district</p>
            <p className="text-gray-400 text-sm mt-1">
              Reports will appear here when available
            </p>
          </div>
        ) : (
          reports.map((report) => (
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
