'use client';

import { useState } from 'react';

const Legend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm">Legend</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100 space-y-4">
          {/* Severity Colors */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Severity Levels</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-severity-low"></div>
                <span className="text-sm text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-severity-medium"></div>
                <span className="text-sm text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-severity-high"></div>
                <span className="text-sm text-gray-600">High</span>
              </div>
            </div>
          </div>

          {/* Marker Types */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Marker Types</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  5
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Cluster:</strong> Shows count and average severity
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg width="20" height="26" viewBox="0 0 30 40" className="shrink-0">
                  <path
                    d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z"
                    fill="#ef4444"
                  />
                  <circle cx="15" cy="15" r="8" fill="white" />
                </svg>
                <div className="text-sm text-gray-600">
                  <strong>Pin:</strong> Individual pothole report
                </div>
              </div>
            </div>
          </div>

          {/* Status Types
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Status Types</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                New
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Triaged
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Assigned
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Fixed
              </span>
            </div>
          </div> */}

          {/* Instructions */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold text-gray-700">How to Use</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Click a cluster to view reports in that area</li>
              <li>Click a pin to see individual report details</li>
              <li>Zoom in to split clusters into individual pins</li>
              <li>View all reports on the map</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Legend;
