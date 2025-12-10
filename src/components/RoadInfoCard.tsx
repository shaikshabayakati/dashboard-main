'use client';

import React from 'react';
import { RoadFeature } from '@/utils/roadLayer';

interface RoadInfoCardProps {
  road: RoadFeature;
  onClose: () => void;
}

const RoadInfoCard: React.FC<RoadInfoCardProps> = ({ road, onClose }) => {
  const { properties } = road;

  // Extract road information from properties
  const roadName = properties?.road_name || properties?.ROAD_NAME || properties?.name || 'Unknown Road';
  const roadType = properties?.road_type || properties?.ROAD_TYPE || properties?.type || 'Unknown';
  const roadOwnership = properties?.road_ownership || properties?.OWNERSHIP || properties?.ownership || 'Unknown';
  const roadAuthority = properties?.road_authority || properties?.AUTHORITY || properties?.authority || 'Unknown';
  const roadClassification = properties?.road_classification || properties?.CLASS || properties?.classification || 'Unknown';
  const roadLength = properties?.length || properties?.LENGTH;
  const roadWidth = properties?.width || properties?.WIDTH;

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-semibold">Road Information</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Road Name */}
        <div>
          <h4 className="font-semibold text-gray-800 text-lg">{roadName}</h4>
        </div>

        {/* Road Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Road Type */}
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-600 font-medium">Type:</span>
            <div className="text-gray-800 mt-1">{roadType}</div>
          </div>

          {/* Road Classification */}
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-600 font-medium">Classification:</span>
            <div className="text-gray-800 mt-1">{roadClassification}</div>
          </div>
        </div>

        {/* Ownership Information */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-yellow-800 font-semibold">Ownership</span>
          </div>
          <div className="text-yellow-700 font-medium">{roadOwnership}</div>
          
          {roadAuthority !== 'Unknown' && (
            <div className="mt-2">
              <span className="text-yellow-600 text-sm">Authority:</span>
              <div className="text-yellow-700 text-sm">{roadAuthority}</div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {(roadLength || roadWidth) && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Additional Details</h5>
            {roadLength && (
              <div className="text-sm text-gray-600 mb-1">
                Length: {typeof roadLength === 'number' ? `${roadLength.toFixed(2)} km` : roadLength}
              </div>
            )}
            {roadWidth && (
              <div className="text-sm text-gray-600">
                Width: {typeof roadWidth === 'number' ? `${roadWidth.toFixed(2)} m` : roadWidth}
              </div>
            )}
          </div>
        )}

        {/* All Properties (Debug) - Only show if in development */}
        {process.env.NODE_ENV === 'development' && properties && (
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
              Show all properties (debug)
            </summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(properties, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default RoadInfoCard;