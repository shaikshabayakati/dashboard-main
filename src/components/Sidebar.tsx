'use client';

import React, { useState } from 'react';
import { District, andhraPradeshDistricts, defaultStateCenter } from '@/data/districts';
import Legend from './Legend';

interface SidebarProps {
  onDistrictSelect: (district: District) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDistrictSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = event.target.value;
    setSelectedDistrict(districtId);

    if (districtId === '') {
      // Reset to state view
      onDistrictSelect(defaultStateCenter);
    } else {
      const district = andhraPradeshDistricts.find((d) => d.id === districtId);
      if (district) {
        onDistrictSelect(district);
      }
    }
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
            </div>

            {/* District Selection */}
            <div className="space-y-2">
              <label htmlFor="district-select" className="block text-sm font-semibold text-gray-700">
                Select District
              </label>
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                <option value="">All Districts (State View)</option>
                {andhraPradeshDistricts
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
              </select>
              {selectedDistrict && (
                <button
                  onClick={() => {
                    setSelectedDistrict('');
                    onDistrictSelect(defaultStateCenter);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Statistics Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total Reports</span>
                  <span className="text-sm font-bold text-blue-900">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Active Issues</span>
                  <span className="text-sm font-bold text-orange-600">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Fixed</span>
                  <span className="text-sm font-bold text-green-600">-</span>
                </div>
              </div>
            </div>

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
