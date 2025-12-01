'use client';

import React from 'react';

interface SpiderfyMarkerProps {
  center: { lat: number; lng: number };
  position: { lat: number; lng: number };
  severityLabel?: string;
  onClick: () => void;
}

/**
 * Component for rendering a spiderfied marker with a leg connecting to the center
 * Used when multiple markers are at the same location and need to be spread out
 */
const SpiderfyMarker: React.FC<SpiderfyMarkerProps> = ({ center, position, severityLabel, onClick }) => {
  // Calculate line from center to marker position (for the "leg")
  const getSeverityColor = (label: string | null | undefined): string => {
    if (!label) return '#6b7280';
    const normalized = label.toLowerCase();
    if (normalized === 'low') return '#10b981';
    if (normalized === 'medium') return '#f59e0b';
    if (normalized === 'high') return '#ef4444';
    return '#6b7280';
  };

  const color = getSeverityColor(severityLabel);

  return (
    <>
      {/* Spider leg line */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="0"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="3,3"
          opacity="0.6"
        />
      </svg>

      {/* Marker pin */}
      <div
        onClick={onClick}
        className="cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform"
        style={{ zIndex: 1000 }}
      >
        <svg width="24" height="32" viewBox="0 0 24 32" className="drop-shadow-lg">
          <path
            d="M12 0C5.373 0 0 5.373 0 12c0 6.627 12 20 12 20s12-13.373 12-20C24 5.373 18.627 0 12 0z"
            fill={color}
          />
          <circle cx="12" cy="12" r="6" fill="white" />
          <circle cx="12" cy="12" r="4" fill={color} />
        </svg>
      </div>
    </>
  );
};

export default SpiderfyMarker;
