'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { PotholeReport } from '@/types/PotholeReport';
import { useGeographic } from '@/contexts/GeographicContext';
import Legend from './Legend';

interface SidebarProps {
  reports: PotholeReport[];
  onFilterChange: (filters: { district: string | null; mandal: string | null }) => void;
  showReportsSidebar?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ reports, onFilterChange, showReportsSidebar = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');

  const { districts, getMandalsForSelectedDistrict, isLoading, error } = useGeographic();

  // Get available mandals for the selected district
  const availableMandals = useMemo(() => {
    if (!selectedDistrict) {
      return [];
    }
    return getMandalsForSelectedDistrict(selectedDistrict);
  }, [selectedDistrict, getMandalsForSelectedDistrict]);

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const districtValue = event.target.value;
    setSelectedDistrict(districtValue);
    setSelectedMandal(''); // Reset mandal when district changes

    onFilterChange({
      district: districtValue || null,
      mandal: null
    });
  };

  const handleMandalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mandalValue = event.target.value;
    setSelectedMandal(mandalValue);

    onFilterChange({
      district: selectedDistrict || null,
      mandal: mandalValue || null
    });
  };

  const handleClearAll = () => {
    setSelectedDistrict('');
    setSelectedMandal('');
    onFilterChange({ district: null, mandal: null });
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-20 ${isCollapsed ? 'w-12' : 'w-80'
          }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors z-30"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Sidebar Content */}
        {!isCollapsed && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="384" height="21.3334" fill="#F97316" />
                  <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                  <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.86 7.19386 428.994 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.856 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.976 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.774 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.977C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 383.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347C128.021 385.347 128.042 385.347 128.062 385.347Z" fill="#F97316" />
                  <path d="M128 384V512H256L128 384Z" fill="#F97316" />
                </svg>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Pothole Dashboard</h1>
                  <p className="text-sm text-gray-500">Andhra Pradesh</p>
                </div>
              </div>
              {(selectedDistrict || selectedMandal) && (
                <p className="text-xs text-blue-600 mt-2">
                  {reports.filter(r =>
                    (!selectedDistrict || r.district === selectedDistrict) &&
                    (!selectedMandal || r.mandal === selectedMandal || r.subDistrict === selectedMandal)
                  ).length} reports shown
                </p>
              )}
            </div>

            {/* District Selection */}
            <div className="space-y-2">
              <label htmlFor="district-select" className="block text-sm font-semibold text-gray-700">
                Filter by District
              </label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading districts...</div>
              ) : error ? (
                <div className="text-sm text-red-500">Error loading districts</div>
              ) : (
                <select
                  id="district-select"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mandal/Sub-district Selection */}
            <div className="space-y-2">
              <label htmlFor="mandal-select" className="block text-sm font-semibold text-gray-700">
                Filter by Mandal/Sub-district
              </label>
              <select
                id="mandal-select"
                value={selectedMandal}
                onChange={handleMandalChange}
                disabled={!selectedDistrict || availableMandals.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedDistrict
                    ? `All Mandals in ${selectedDistrict}`
                    : `Select a district first`}
                </option>
                {availableMandals.map((mandal) => (
                  <option key={mandal} value={mandal}>
                    {mandal}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedDistrict || selectedMandal) && (
              <button
                onClick={handleClearAll}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}

            {/* Legend Component */}
            <Legend />

            {/* Info Section */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>Select a district to focus the map on that area. Click markers to view details.</p>
            </div>
          </div>
        )}

        {/* Collapsed Icon */}
        {isCollapsed && (
          <div className="flex flex-col items-center pt-6 space-y-4">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
