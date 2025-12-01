'use client';

import React from 'react';
import { getSeverityColor, getSeverityLabel } from '@/utils/helpers';

interface ClusterMarkerProps {
  count: number;
  dominantSeverityLabel: string;
  onClick: () => void;
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({ count, dominantSeverityLabel, onClick }) => {
  // Color based on dominant severity (which type has the most count)
  // If most potholes are LOW → Green
  // If most potholes are MEDIUM → Yellow/Amber
  // If most potholes are HIGH → Red
  const color = getSeverityColor(dominantSeverityLabel);
  const severityLabel = getSeverityLabel(dominantSeverityLabel);

  // Dynamic sizing based on count - more reports = larger cluster
  const baseSize = 40;  // Smaller minimum
  const size = Math.min(60, baseSize + Math.log2(count + 1) * 6);  // Smaller max

  // Ring size for the outer glow effect
  const ringSize = size + 8;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200 group"
      style={{ width: `${ringSize}px`, height: `${ringSize}px` }}
    >
      {/* Outer ring / glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
        style={{
          backgroundColor: color,
          filter: 'blur(4px)'
        }}
      />

      {/* Main cluster circle */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center text-white font-bold shadow-xl border-2 border-white/30"
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Count */}
        <div className="text-lg font-bold leading-none">{count}</div>
        {/* Severity indicator */}
        <div className="text-[10px] opacity-90 font-medium mt-0.5">
          {severityLabel.charAt(0)}
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {count} reports • Most: {severityLabel}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -bottom-1"></div>
      </div>
    </div>
  );
};

export default ClusterMarker;
