export interface DistrictBoundary {
  districtName: string;
  districtId: string;
  outerBoundary: number[][]; // Single outer boundary polygon
  center: { lat: number; lng: number }; // Calculated center
  bounds: { north: number; south: number; east: number; west: number }; // Bounding box
}

// Cache for loaded GeoJSON data
let cachedGeoJSON: any = null;
let cachedBoundaries: Map<string, DistrictBoundary> | null = null;

// Load GeoJSON data from public folder
async function loadGeoJSON(): Promise<any> {
  if (cachedGeoJSON) {
    return cachedGeoJSON;
  }

  try {
    const response = await fetch('/MANDAL.geojson');
    if (!response.ok) {
      throw new Error('Failed to load GeoJSON');
    }
    cachedGeoJSON = await response.json();
    return cachedGeoJSON;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return null;
  }
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

  const mandalGeoJSON = await loadGeoJSON();
  if (!mandalGeoJSON) return [];

  const districtMap = new Map<string, number[][]>();

  // Collect all coordinate points for each district
  mandalGeoJSON.features.forEach((feature: any) => {
    const districtName = feature.properties.DNAME;
    
    if (districtName && feature.geometry && feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates[0]; // Get outer ring only
      
      if (!districtMap.has(districtName)) {
        districtMap.set(districtName, []);
      }
      
      // Add all points from this mandal's outer boundary
      districtMap.get(districtName)!.push(...coordinates);
    }
  });

  // Create outer boundaries for each district
  cachedBoundaries = new Map();
  districtMap.forEach((points, districtName) => {
    // Get convex hull (outer boundary) from all points
    const outerBoundary = getConvexHull(points);
    const center = calculateCenter(outerBoundary);
    const bounds = calculateBounds(outerBoundary);
    
    cachedBoundaries!.set(districtName, {
      districtName,
      districtId: districtName.toLowerCase().replace(/\s+/g, '-'),
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

// Get all mandals for a specific district
export async function getMandalsByDistrictName(districtName: string): Promise<any[]> {
  const mandalGeoJSON = await loadGeoJSON();
  if (!mandalGeoJSON) return [];

  return mandalGeoJSON.features.filter(
    (feature: any) => feature.properties.DNAME === districtName
  );
}
