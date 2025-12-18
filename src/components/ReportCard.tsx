'use client';

import React, { useState, useEffect } from 'react';
import { PotholeReport } from '@/types/PotholeReport';
import {
  getSeverityColor,
  getSeverityLabel,
  getRelativeTime,
  formatTimestamp,
  getStatusBadgeColor,
  getAddressFromCoordinates
} from '@/utils/helpers';
import ImageModal from './ImageModal';

interface ReportCardProps {
  report: PotholeReport;
  onClose?: () => void;
  isExpanded?: boolean;
  onImageClick?: (imageUrl: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClose, isExpanded = false, onImageClick }) => {
  // Use severityLabel from database directly - no numeric fallback
  const severityColor = getSeverityColor(report.severityLabel);
  const severityLabel = getSeverityLabel(report.severityLabel);
  const [address, setAddress] = useState<string>('Loading address...');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleImageClick = () => {
    if (onImageClick && report.images && report.images.length > 0) {
      onImageClick(report.images[0]);
    } else {
      setIsImageModalOpen(true);
    }
  };

  useEffect(() => {
    // Priority: 1. Database address, 2. location field, 3. Fetch from coordinates
    if (report.address) {
      setAddress(report.address);
    } else if (report.location) {
      setAddress(report.location);
    } else {
      getAddressFromCoordinates(report.lat, report.lng).then(setAddress);
    }
  }, [report.lat, report.lng, report.location, report.address]);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-auto select-text"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black-700">Report #{report.id}</span>
          </div>
          <div className="text-sm text-gray-500">
            {getRelativeTime(report.timestamp)} • {formatTimestamp(report.timestamp)}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Image */}
      {report.images.length > 0 && (
        <div
          className="relative h-48 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Image clicked, opening modal');
            handleImageClick();
          }}
        >
          <img
            src={report.images[0]}
            alt="Pothole"
            className="w-full h-full object-cover"
          />
          {/* Overlay hint on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">

        {/* Location */}
        <div className="flex items-start justify-between text-sm">
          <span className="font-medium text-gray-700">📍 Location</span>
          <span className="text-gray-600 text-right max-w-[60%] select-text">
            {address}
          </span>
        </div>

        {/* Road Information
        {(report.roadName || report.roadNameFromGeoJson) && (
          <div className="flex items-start justify-between text-sm">
            <span className="font-medium text-gray-700">🛣️ Road</span>
            <span className="text-gray-600 text-right max-w-[60%] select-text">
              {report.roadNameFromGeoJson || report.roadName || 'Unknown Road'}
              {(report.roadType || report.roadTypeFromGeoJson) && (
                <span className="text-gray-500 ml-1">
                  ({report.roadTypeFromGeoJson || report.roadType})
                </span>
              )}
            </span>
          </div>
        )} */}

        {/* Road Ownership */}
        {report.roadOwnership && report.roadOwnership !== 'Unknown' && (
          <div className="flex items-start justify-between text-sm">
            <span className="font-medium text-gray-700">🏛️ Ownership</span>
            <span className="text-gray-600 text-right max-w-[60%] select-text">
              {report.roadOwnership}
              {report.roadAuthority && report.roadAuthority !== 'Unknown' && (
                <span className="text-gray-500 block text-xs">
                  Authority: {report.roadAuthority}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Road Classification */}
        {report.roadClassification && report.roadClassification !== 'Unknown' && (
          <div className="flex items-start justify-between text-sm">
            <span className="font-medium text-gray-700">📋 Class</span>
            <span className="text-gray-600 text-right max-w-[60%] select-text">
              {report.roadClassification}
            </span>
          </div>
        )}

        {/* Pothole Count */}
        {report.detectionCount !== undefined && (
          <div className="flex items-start justify-between text-sm">
            <span className="font-medium text-gray-700">🕳️ Pothole Count</span>
            <span className="text-gray-600 text-right">
              {report.detectionCount} {report.detectionCount === 1 ? 'pothole' : 'potholes'}
            </span>
          </div>
        )}

        {/* Severity */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">⚠️ Severity</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: severityColor }}
          >
            {severityLabel}
          </span>
        </div>

        {/* Impact Score */}
        {report.impactScore !== undefined && (
          <div className="flex items-start justify-between text-sm">
            <div className="flex items-center gap-1 group relative">
              <span className="font-medium text-gray-700">📈 Impact Score</span>
              <span className="cursor-help text-gray-400 hover:text-gray-600 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              {/* Tooltip */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 bottom-6 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                <p className="leading-relaxed">
                  The impact score is calculated by combining both pothole severity and the traffic conditions. Higher scores highlight locations where severe potholes and traffic levels together create the greatest urgency for repair.
                </p>
              </div>
            </div>
            <span className="text-gray-600 text-right font-semibold">
              {report.impactScore}
            </span>
          </div>
        )}


      </div>

      {/* Image Modal */}
      {isImageModalOpen && report.images.length > 0 && (
        <ImageModal
          imageUrl={report.images[0]}
          onClose={() => setIsImageModalOpen(false)}
          altText={`Pothole Report #${report.id}`}
        />
      )}
    </div>
  );
};

export default ReportCard;
