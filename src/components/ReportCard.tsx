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

interface ReportCardProps {
  report: PotholeReport;
  onClose?: () => void;
  isExpanded?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClose, isExpanded = false }) => {
  const severityColor = getSeverityColor(report.severity);
  const severityLabel = getSeverityLabel(report.severity);
  const [address, setAddress] = useState<string>('Loading address...');

  useEffect(() => {
    // Use the location from report if available, otherwise fetch from coordinates
    if (report.location) {
      setAddress(report.location);
    } else {
      getAddressFromCoordinates(report.lat, report.lng).then(setAddress);
    }
  }, [report.lat, report.lng, report.location]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">Report #{report.id}</span>
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
        <div className="relative h-48 bg-gray-100">
          <img
            src={report.images[0]}
            alt="Pothole"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Severity */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Severity</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${report.severity * 100}%`,
                  backgroundColor: severityColor
                }}
              />
            </div>
            <span
              className="font-bold text-sm"
              style={{ color: severityColor }}
            >
              {report.severity.toFixed(2)} ({severityLabel})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start justify-between text-sm">
          <span className="font-medium text-gray-700">Location</span>
          <span className="text-gray-600 text-right max-w-[60%]">
            {address}
          </span>
        </div>

       
      </div>
    </div>
  );
};

export default ReportCard;
