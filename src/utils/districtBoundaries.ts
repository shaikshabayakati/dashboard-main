import { loadGeoJSON as loadGeoJSONFromParser, GeoJSONData } from './geoJsonParser';

export interface DistrictBoundary {
  districtName: string;
  districtId: string;
  outerBoundary: number[][]; // Single outer boundary polygon
  center: { lat: number; lng: number }; // Calculated center
  bounds: { north: number; south: number; east: number; west: number }; // Bounding box
}

export interface MandalBoundary {
  mandalName: string;
  mandalId: string;
  districtName: string;
  districtId: string;
  boundary: number[][]; // Mandal boundary polygon
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
}

// Cache for loaded GeoJSON data
let cachedBoundaries: Map<string, DistrictBoundary> | null = null;
let cachedMandalBoundaries: MandalBoundary[] | null = null;

// Load GeoJSON data from public folder (use the parser utility)
async function loadGeoJSON(): Promise<GeoJSONData | null> {
  return loadGeoJSONFromParser();
}

// Calculate the convex hull (outer boundary) from multiple polygons
function getConvexHull(points: number[][]): number[][] {
  if (points.length < 3) return points;

  // Sort points by x-coordinate, then y-coordinate
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Build lower hull
  const lower: number[][] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  // Build upper hull
  const upper: number[][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

// Cross product for convex hull
function cross(o: number[], a: number[], b: number[]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

// Calculate center point from polygon
function calculateCenter(polygon: number[][]): { lat: number; lng: number } {
  let sumLat = 0;
  let sumLng = 0;
  
  polygon.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });

  return {
    lat: sumLat / polygon.length,
    lng: sumLng / polygon.length
  };
}

// Calculate bounding box
function calculateBounds(polygon: number[][]): { north: number; south: number; east: number; west: number } {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  polygon.forEach(([lng, lat]) => {
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  });

  return { north, south, east, west };
}

// Extract unique district boundaries from mandal GeoJSON
// Creates outer boundary for each district
export async function getDistrictBoundaries(): Promise<DistrictBoundary[]> {
  if (cachedBoundaries) {
    return Array.from(cachedBoundaries.values());
  }

  const geoJSON = await loadGeoJSON();
  if (!geoJSON) return [];

  const districtMap = new Map<string, number[][]>();

  // Collect all coordinate points for each district
  geoJSON.features.forEach((feature: any) => {
    const districtName = feature.properties.dtname; // Changed from DNAME to dtname
    
    if (districtName && feature.geometry && feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates[0]; // Get outer ring only
      
      if (!districtMap.has(districtName)) {
        districtMap.set(districtName, []);
      }
      
      // Add all points from this mandal's outer boundary
      districtMap.get(districtName)!.push(...coordinates);
    }
  });

  // Normalize function to match geoJsonParser.ts
  const normalize = (name: string) => name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Create outer boundaries for each district
  cachedBoundaries = new Map();
  districtMap.forEach((points, districtName) => {
    // Get convex hull (outer boundary) from all points
    const outerBoundary = getConvexHull(points);
    const center = calculateCenter(outerBoundary);
    const bounds = calculateBounds(outerBoundary);
    
    cachedBoundaries!.set(districtName, {
      districtName,
      districtId: normalize(districtName),
      outerBoundary,
      center,
      bounds
    });
  });

  return Array.from(cachedBoundaries.values());
}

// Get boundary for a specific district by ID
export async function getDistrictBoundary(districtId: string): Promise<DistrictBoundary | null> {
  const boundaries = await getDistrictBoundaries();
  return boundaries.find(b => b.districtId === districtId) || null;
}

// Get all mandals with their boundaries
export async function getAllMandalBoundaries(): Promise<MandalBoundary[]> {
  if (cachedMandalBoundaries) {
    return cachedMandalBoundaries;
  }

  const geoJSON = await loadGeoJSON();
  if (!geoJSON) return [];

  cachedMandalBoundaries = geoJSON.features.map((feature: any) => {
    const districtName = feature.properties.dtname;
    const mandalName = feature.properties.sdtname;
    const coordinates = feature.geometry.coordinates[0];
    
    // Normalize function to match geoJsonParser.ts
    const normalize = (name: string) => name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      mandalName,
      mandalId: `${normalize(districtName)}-${normalize(mandalName)}`,
      districtName,
      districtId: normalize(districtName),
      boundary: coordinates,
      center: calculateCenter(coordinates),
      bounds: calculateBounds(coordinates)
    };
  });

  return cachedMandalBoundaries;
}

// Get all mandals for a specific district
export async function getMandalsByDistrictId(districtId: string): Promise<MandalBoundary[]> {
  const allMandals = await getAllMandalBoundaries();
  return allMandals.filter(mandal => mandal.districtId === districtId);
}

// Get all mandals for a specific district by name
export async function getMandalsByDistrictName(districtName: string): Promise<MandalBoundary[]> {
  const allMandals = await getAllMandalBoundaries();
  return allMandals.filter(mandal => mandal.districtName === districtName);
}
