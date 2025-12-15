// Utility to parse GeoJSON and extract district/mandal data

export interface GeoJSONFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    OBJECTID: number;
    stcode11: string;
    dtcode11: string;
    sdtcode11: string;
    Shape_Length: number;
    Shape_Area: number;
    stname: string;
    dtname: string;
    sdtname: string;
    Subdt_LGD: number;
    Dist_LGD: number;
    State_LGD: number;
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface DistrictInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface MandalInfo {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  lat: number;
  lng: number;
}

// Cache for the parsed GeoJSON
let cachedGeoJSON: GeoJSONData | null = null;
let cachedDistricts: DistrictInfo[] | null = null;
let cachedMandals: MandalInfo[] | null = null;

/**
 * Load the GeoJSON file from the public directory
 */
export async function loadGeoJSON(): Promise<GeoJSONData | null> {
  // Return cached data if available
  if (cachedGeoJSON) {
    return cachedGeoJSON;
  }

  // Only load in browser environment
  if (typeof window === 'undefined') {
    console.warn('GeoJSON loading skipped on server-side');
    return null;
  }

  try {
    // Use relative path that works in browser
    const fileName = 'ANDHRA PRADESH_SUBDISTRICTS.geojson';
    const encodedPath = encodeURI(`/${fileName}`);

    const response = await fetch(encodedPath);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    cachedGeoJSON = await response.json();
    return cachedGeoJSON;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return null;
  }
}

/**
 * Calculate the center point of a polygon
 */
function calculateCenter(coordinates: number[][]): { lat: number; lng: number } {
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  coordinates.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
    count++;
  });

  return {
    lat: sumLat / count,
    lng: sumLng / count
  };
}

/**
 * Normalize district name to create a consistent ID
 */
function normalizeDistrictName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Extract all unique districts from the GeoJSON data
 */
export async function extractDistricts(): Promise<DistrictInfo[]> {
  if (cachedDistricts) {
    return cachedDistricts;
  }

  const geoJSON = await loadGeoJSON();
  if (!geoJSON) return [];

  // Map to store districts with all their mandal polygons
  const districtMap = new Map<string, {
    name: string;
    coordinates: number[][][];
  }>();

  // Collect all features by district
  geoJSON.features.forEach((feature) => {
    const districtName = feature.properties.dtname;

    if (!districtName) return;

    if (!districtMap.has(districtName)) {
      districtMap.set(districtName, {
        name: districtName,
        coordinates: []
      });
    }

    // Add this mandal's coordinates to the district
    if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0] as number[][];
      districtMap.get(districtName)!.coordinates.push(coords);
    }
  });

  // Calculate center point for each district
  cachedDistricts = Array.from(districtMap.entries()).map(([_, data]) => {
    // Calculate center from all mandal polygons
    let totalLat = 0;
    let totalLng = 0;
    let totalPoints = 0;

    data.coordinates.forEach((polygon) => {
      polygon.forEach(([lng, lat]) => {
        totalLat += lat;
        totalLng += lng;
        totalPoints++;
      });
    });

    const centerLat = totalPoints > 0 ? totalLat / totalPoints : 0;
    const centerLng = totalPoints > 0 ? totalLng / totalPoints : 0;

    return {
      id: normalizeDistrictName(data.name),
      name: data.name,
      lat: centerLat,
      lng: centerLng,
      zoom: 10
    };
  });

  // Sort by name for consistency
  cachedDistricts.sort((a, b) => a.name.localeCompare(b.name));

  return cachedDistricts;
}

/**
 * Extract all mandals from the GeoJSON data
 */
export async function extractMandals(): Promise<MandalInfo[]> {
  if (cachedMandals) {
    return cachedMandals;
  }

  const geoJSON = await loadGeoJSON();
  if (!geoJSON) return [];

  cachedMandals = geoJSON.features.map((feature) => {
    const districtName = feature.properties.dtname;
    const mandalName = feature.properties.sdtname;

    // Calculate center of the mandal polygon
    const coordinates: number[][] = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0] as number[][]
      : feature.geometry.coordinates[0][0] as number[][];

    const center = calculateCenter(coordinates);

    return {
      id: `${normalizeDistrictName(districtName)}-${normalizeDistrictName(mandalName)}`,
      name: mandalName,
      districtId: normalizeDistrictName(districtName),
      districtName: districtName,
      lat: center.lat,
      lng: center.lng
    };
  });

  // Sort by district then mandal name
  cachedMandals.sort((a, b) => {
    const districtCompare = a.districtName.localeCompare(b.districtName);
    if (districtCompare !== 0) return districtCompare;
    return a.name.localeCompare(b.name);
  });

  return cachedMandals;
}

/**
 * Get all mandals for a specific district
 */
export async function getMandalsByDistrictId(districtId: string): Promise<MandalInfo[]> {
  const allMandals = await extractMandals();
  return allMandals.filter(mandal => mandal.districtId === districtId);
}

/**
 * Get a specific district by ID
 */
export async function getDistrictById(districtId: string): Promise<DistrictInfo | null> {
  const districts = await extractDistricts();
  return districts.find(d => d.id === districtId) || null;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: { lat: number; lng: number }, polygon: number[][]): boolean {
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

/**
 * Find the district and mandal for a given coordinate point
 * Returns null for both if the point is not found in any mandal
 */
export async function getDistrictAndMandalFromCoordinates(
  lat: number,
  lng: number
): Promise<{ district: string | null; mandal: string | null }> {
  const geoJSON = await loadGeoJSON();
  if (!geoJSON) {
    return { district: null, mandal: null };
  }

  const point = { lat, lng };

  // Search through all features to find which mandal contains this point
  for (const feature of geoJSON.features) {
    // Get the polygon coordinates
    let polygons: number[][][] = [];

    if (feature.geometry.type === 'Polygon') {
      polygons = [feature.geometry.coordinates[0] as number[][]];
    } else if (feature.geometry.type === 'MultiPolygon') {
      polygons = (feature.geometry.coordinates as number[][][][]).map(poly => poly[0]);
    }

    // Check if point is in any of the polygons
    for (const polygon of polygons) {
      if (isPointInPolygon(point, polygon)) {
        return {
          district: feature.properties.dtname || null,
          mandal: feature.properties.sdtname || null
        };
      }
    }
  }

  // Point not found in any mandal
  return { district: null, mandal: null };
}
