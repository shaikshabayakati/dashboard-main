'use client';

import React, { useState, useMemo } from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import Legend from './Legend';

interface SidebarProps {
  reports: PotholeReport[];
  onFilterChange: (filters: { district: string | null; mandal: string | null }) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ reports, onFilterChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');

  // Extract unique districts from reports
  const districts = useMemo(() => {
    const districtSet = new Set<string>();
    reports.forEach(report => {
      if (report.district && report.district.trim()) {
        districtSet.add(report.district.trim());
      }
    });
    return Array.from(districtSet).sort();
  }, [reports]);

  // Extract unique mandals from reports (for selected district or all)
  const availableMandals = useMemo(() => {
    const mandalSet = new Set<string>();
    reports.forEach(report => {
      const mandal = report.mandal || report.subDistrict;
      // If a district is selected, only show mandals from that district
      if (selectedDistrict) {
        if (report.district === selectedDistrict && mandal && mandal.trim()) {
          mandalSet.add(mandal.trim());
        }
      } else {
        // Show all mandals if no district selected
        if (mandal && mandal.trim()) {
          mandalSet.add(mandal.trim());
        }
      }
    });
    return Array.from(mandalSet).sort();
  }, [reports, selectedDistrict]);

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
        className={`absolute top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-20 ${
          isCollapsed ? 'w-12' : 'w-80'
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
              <h1 className="text-xl font-bold text-gray-900">Pothole Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Andhra Pradesh</p>
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
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                <option value="">All Districts ({districts.length} districts)</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district} ({reports.filter(r => r.district === district).length})
                  </option>
                ))}
              </select>
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
                disabled={!selectedDistrict && availableMandals.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedDistrict 
                    ? `All Mandals in ${selectedDistrict} (${availableMandals.length})` 
                    : `All Mandals (${availableMandals.length})`}
                </option>
                {availableMandals.map((mandal) => {
                  const count = reports.filter(r => 
                    (r.mandal === mandal || r.subDistrict === mandal) &&
                    (!selectedDistrict || r.district === selectedDistrict)
                  ).length;
                  return (
                    <option key={mandal} value={mandal}>
                      {mandal} ({count})
                    </option>
                  );
                })}
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
