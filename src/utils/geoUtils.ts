/**
 * Utility functions for geographic operations including point-in-polygon checks
 */

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    [key: string]: any;
    stname?: string;
    dtname?: string;
    sdtname?: string;
    OBJECTID?: number;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Check if a point is inside a polygon using the ray casting algorithm
 * @param point [longitude, latitude]
 * @param polygon Array of [longitude, latitude] coordinates defining the polygon boundary
 */
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point is inside a MultiPolygon
 * @param point [longitude, latitude]
 * @param multiPolygon Array of polygon coordinates
 */
export function isPointInMultiPolygon(point: [number, number], multiPolygon: number[][][][]): boolean {
  for (const polygon of multiPolygon) {
    // Check the outer ring (first element)
    if (polygon.length > 0 && isPointInPolygon(point, polygon[0])) {
      // Check if the point is in any holes (subsequent elements)
      let inHole = false;
      for (let i = 1; i < polygon.length; i++) {
        if (isPointInPolygon(point, polygon[i])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find which district/mandal a coordinate point falls into
 * @param lat Latitude
 * @param lng Longitude
 * @param geoJsonData GeoJSON feature collection containing boundary data
 * @returns The feature that contains the point, or null if not found
 */
export function findContainingFeature(
  lat: number, 
  lng: number, 
  geoJsonData: GeoJSONFeatureCollection
): GeoJSONFeature | null {
  const point: [number, number] = [lng, lat]; // GeoJSON uses [longitude, latitude] format

  for (const feature of geoJsonData.features) {
    const { geometry } = feature;
    
    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates as number[][][];
      // Check the outer ring (first element)
      if (coordinates.length > 0 && isPointInPolygon(point, coordinates[0])) {
        // Check if the point is in any holes (subsequent elements)
        let inHole = false;
        for (let i = 1; i < coordinates.length; i++) {
          if (isPointInPolygon(point, coordinates[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) {
          return feature;
        }
      }
    } else if (geometry.type === 'MultiPolygon') {
      const coordinates = geometry.coordinates as number[][][][];
      if (isPointInMultiPolygon(point, coordinates)) {
        return feature;
      }
    }
  }

  return null;
}

/**
 * Get district name from a GeoJSON feature
 */
export function getDistrictName(feature: GeoJSONFeature): string | null {
  return feature.properties?.dtname || null;
}

/**
 * Get mandal/sub-district name from a GeoJSON feature
 */
export function getMandalName(feature: GeoJSONFeature): string | null {
  return feature.properties?.sdtname || null;
}

/**
 * Load and parse GeoJSON data
 * @param url URL to the GeoJSON file
 * @returns Promise resolving to GeoJSON feature collection
 */
export async function loadGeoJSONData(url: string): Promise<GeoJSONFeatureCollection> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON data: ${response.statusText}`);
    }
    const data = await response.json();
    return data as GeoJSONFeatureCollection;
  } catch (error) {
    console.error('Error loading GeoJSON data:', error);
    throw error;
  }
}

/**
 * Get all unique districts from GeoJSON data
 */
export function getDistrictsFromGeoJSON(geoJsonData: GeoJSONFeatureCollection): string[] {
  const districts = new Set<string>();
  
  geoJsonData.features.forEach(feature => {
    const district = getDistrictName(feature);
    if (district) {
      districts.add(district);
    }
  });

  return Array.from(districts).sort();
}

/**
 * Get all mandals for a specific district from GeoJSON data
 */
export function getMandalsForDistrict(
  geoJsonData: GeoJSONFeatureCollection, 
  districtName: string
): string[] {
  const mandals = new Set<string>();
  
  geoJsonData.features
    .filter(feature => getDistrictName(feature) === districtName)
    .forEach(feature => {
      const mandal = getMandalName(feature);
      if (mandal) {
        mandals.add(mandal);
      }
    });

  return Array.from(mandals).sort();
}

/**
 * Filter reports by geographic boundaries
 * @param reports Array of reports with lat/lng coordinates
 * @param geoJsonData GeoJSON data for boundary checking
 * @param selectedDistrict Selected district name
 * @param selectedMandal Selected mandal name
 * @returns Filtered array of reports
 */
export function filterReportsByGeography<T extends { lat: number; lng: number }>(
  reports: T[],
  geoJsonData: GeoJSONFeatureCollection,
  selectedDistrict: string | null = null,
  selectedMandal: string | null = null
): T[] {
  if (!selectedDistrict && !selectedMandal) {
    return reports; // No geographic filtering needed
  }

  return reports.filter(report => {
    const feature = findContainingFeature(report.lat, report.lng, geoJsonData);
    
    if (!feature) {
      return false; // Point doesn't fall within any known boundary
    }

    const reportDistrict = getDistrictName(feature);
    const reportMandal = getMandalName(feature);

    // Check district filter
    if (selectedDistrict && reportDistrict !== selectedDistrict) {
      return false;
    }

    // Check mandal filter
    if (selectedMandal && reportMandal !== selectedMandal) {
      return false;
    }

    return true;
  });
}