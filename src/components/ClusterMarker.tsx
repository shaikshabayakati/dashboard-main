'use client';

import React from 'react';
import { getSeverityColor } from '@/utils/helpers';

interface ClusterMarkerProps {
  count: number;
  avgSeverity: number;
  onClick: () => void;
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({ count, avgSeverity, onClick }) => {
  const color = getSeverityColor(avgSeverity);
  const size = Math.min(60, 30 + Math.log(count) * 10);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className="w-full h-full rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg"
        style={{ backgroundColor: color }}
      >
        <div className="text-lg">{count}</div>
        <div className="text-xs opacity-90">{avgSeverity.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default ClusterMarker;
