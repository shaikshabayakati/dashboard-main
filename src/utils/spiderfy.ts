/**
 * Utility functions for spiderfying markers (spreading them out in a spiral/circle pattern)
 * Similar to Leaflet.markercluster's spiderfy behavior
 */

export interface SpiderfyPosition {
  lat: number;
  lng: number;
}

/**
 * Calculate spiderfy positions for markers at the same location
 * Spreads them out in a spiral pattern
 *
 * @param center - The center point where markers are clustered
 * @param count - Number of markers to spread out
 * @param zoom - Current zoom level (affects spacing)
 * @returns Array of positions for each marker
 */
export function calculateSpiderfyPositions(
  center: { lat: number; lng: number },
  count: number,
  zoom: number
): SpiderfyPosition[] {
  const positions: SpiderfyPosition[] = [];

  // Base distance in degrees - at zoom 19, spread by about 0.0001 degrees (~10 meters)
  // Scale inversely with zoom
  const baseDistance = 0.00015 * Math.pow(2, 19 - zoom);

  if (count === 1) {
    return [center];
  }

  if (count === 2) {
    // For 2 markers, place them horizontally
    positions.push({
      lat: center.lat,
      lng: center.lng - baseDistance * 1.5
    });
    positions.push({
      lat: center.lat,
      lng: center.lng + baseDistance * 1.5
    });
    return positions;
  }

  // For 3+ markers, arrange in a circle
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i;

    // For many markers, create concentric circles
    let distance = baseDistance * 1.5;
    if (count > 8) {
      const ring = Math.floor(i / 8);
      distance = baseDistance * (1.5 + ring * 0.8);
    }

    positions.push({
      lat: center.lat + distance * Math.sin(angle),
      lng: center.lng + distance * Math.cos(angle)
    });
  }

  return positions;
}

/**
 * Check if markers are close enough to require spiderfying
 *
 * @param reports - Array of reports to check
 * @param threshold - Distance threshold in degrees (default: 0.00005 ~ 5 meters)
 * @returns true if markers should be spiderfied
 */
export function shouldSpiderfy(
  reports: Array<{ lat: number; lng: number }>,
  threshold: number = 0.00005
): boolean {
  if (reports.length <= 1) return false;

  // Calculate the maximum distance between any two points
  let maxDistance = 0;
  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const latDiff = Math.abs(reports[i].lat - reports[j].lat);
      const lngDiff = Math.abs(reports[i].lng - reports[j].lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  // If all markers are within the threshold, they should be spiderfied
  return maxDistance < threshold;
}

/**
 * Calculate geographical bounds for a set of points
 * Used for fitting map view to cluster bounds
 *
 * @param points - Array of lat/lng points
 * @returns Bounds object with north, south, east, west
 */
export function calculateBounds(points: Array<{ lat: number; lng: number }>): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (points.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = points[0].lat;
  let south = points[0].lat;
  let east = points[0].lng;
  let west = points[0].lng;

  points.forEach(point => {
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  });

  // Add 10% padding
  const latPadding = (north - south) * 0.1 || 0.01;
  const lngPadding = (east - west) * 0.1 || 0.01;

  return {
    north: north + latPadding,
    south: south - latPadding,
    east: east + lngPadding,
    west: west - lngPadding
  };
}
