'use client';

import React from 'react';
import { getSeverityColor } from '@/utils/helpers';

interface PotholeMarkerProps {
  severity: number;
  onClick: () => void;
}

const PotholeMarker: React.FC<PotholeMarkerProps> = ({ severity, onClick }) => {
  const color = getSeverityColor(severity);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform"
    >
      <div className="relative">
        {/* Pin */}
        <svg width="30" height="40" viewBox="0 0 30 40" className="drop-shadow-lg">
          <path
            d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z"
            fill={color}
          />
          <circle cx="15" cy="15" r="8" fill="white" />
          <text
            x="15"
            y="19"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fill={color}
          >
            {(severity * 10).toFixed(1)}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default PotholeMarker;
