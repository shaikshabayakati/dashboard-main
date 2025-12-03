import { PotholeReport } from '@/types/PotholeReport';

// Check if a point is inside a polygon using ray casting algorithm
export function isPointInPolygon(point: { lat: number; lng: number }, polygon: number[][]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
}

// Filter reports that fall within a district boundary
export function filterReportsInBoundary(
  reports: PotholeReport[],
  boundary: number[][]
): PotholeReport[] {
  return reports.filter(report => 
    isPointInPolygon({ lat: report.lat, lng: report.lng }, boundary)
  );
}

// Filter reports that fall within any of multiple boundaries (e.g., mandals in a district)
export function filterReportsInAnyBoundary(
  reports: PotholeReport[],
  boundaries: number[][][]
): PotholeReport[] {
  return reports.filter(report => 
    boundaries.some(boundary => 
      isPointInPolygon({ lat: report.lat, lng: report.lng }, boundary)
    )
  );
}
