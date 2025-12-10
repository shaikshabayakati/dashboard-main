import { Feature, Geometry, GeoJsonProperties, LineString, MultiLineString } from 'geojson';

export interface RoadFeature extends Feature<LineString | MultiLineString, GeoJsonProperties> {
  geometry: LineString | MultiLineString;
}

export interface RoadGeoJSON {
  type: 'FeatureCollection';
  features: RoadFeature[];
}

let cachedRoadData: RoadGeoJSON | null = null;

/**
 * Load the AP Roads GeoJSON data
 */
export async function loadRoadData(): Promise<RoadGeoJSON | null> {
  if (cachedRoadData) {
    return cachedRoadData;
  }

  try {
    const response = await fetch('/AP_Roads_with_Metadata.geojson');
    if (!response.ok) {
      throw new Error(`Failed to load roads data: ${response.statusText}`);
    }
    
    const data = await response.json() as RoadGeoJSON;
    
    // Validate the GeoJSON structure
    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Invalid GeoJSON format');
    }

    // Filter and validate road features
    const validFeatures = data.features.filter(feature => {
      return feature.geometry && 
             (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') &&
             Array.isArray(feature.geometry.coordinates);
    });

    cachedRoadData = {
      type: 'FeatureCollection',
      features: validFeatures
    };

    console.log(`Loaded ${validFeatures.length} road features`);
    return cachedRoadData;
  } catch (error) {
    console.error('Error loading road data:', error);
    return null;
  }
}

/**
 * Convert LineString coordinates to Google Maps LatLng format
 */
export function convertLineStringToLatLng(coordinates: number[][]): google.maps.LatLngLiteral[] {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Convert MultiLineString coordinates to Google Maps LatLng format
 */
export function convertMultiLineStringToLatLng(coordinates: number[][][]): google.maps.LatLngLiteral[][] {
  return coordinates.map(lineString => 
    lineString.map(([lng, lat]) => ({ lat, lng }))
  );
}

/**
 * Get road styling based on road type or other properties
 */
export function getRoadStyle(feature: RoadFeature): google.maps.PolylineOptions {
  // Default road style
  let strokeColor = '#4285F4'; // Google Blue
  let strokeWeight = 2;
  let strokeOpacity = 0.7;

  // Customize based on road properties if available
  const properties = feature.properties;
  if (properties) {
    // Example: Style based on road type, classification, etc.
    const roadType = properties.ROAD_TYPE || properties.roadType || properties.type;
    const roadClass = properties.CLASS || properties.class || properties.ROAD_CLASS;

    if (roadType === 'highway' || roadClass === 'NH') {
      strokeColor = '#FF5722'; // Orange for highways
      strokeWeight = 4;
    } else if (roadType === 'major' || roadClass === 'SH') {
      strokeColor = '#FF9800'; // Amber for state highways
      strokeWeight = 3;
    } else if (roadType === 'arterial' || roadClass === 'MDR') {
      strokeColor = '#FFC107'; // Yellow for major district roads
      strokeWeight = 2.5;
    } else if (roadType === 'local' || roadClass === 'ODR') {
      strokeColor = '#4CAF50'; // Green for other district roads
      strokeWeight = 2;
    }
  }

  return {
    strokeColor,
    strokeWeight,
    strokeOpacity,
    clickable: true,
    zIndex: 1 // Below markers and boundaries
  };
}

/**
 * Filter roads by viewport bounds for performance
 */
export function filterRoadsByBounds(
  roads: RoadFeature[], 
  bounds: google.maps.LatLngBounds
): RoadFeature[] {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  
  return roads.filter(road => {
    const { coordinates, type } = road.geometry;
    
    if (type === 'LineString') {
      // Check if any point in the LineString is within bounds
      const lineCoords = coordinates as number[][];
      return lineCoords.some(([lng, lat]) => 
        lat >= sw.lat() && lat <= ne.lat() && 
        lng >= sw.lng() && lng <= ne.lng()
      );
    } else if (type === 'MultiLineString') {
      // Check if any LineString has points within bounds
      const multiCoords = coordinates as number[][][];
      return multiCoords.some(lineString =>
        lineString.some(([lng, lat]) => 
          lat >= sw.lat() && lat <= ne.lat() && 
          lng >= sw.lng() && lng <= ne.lng()
        )
      );
    }
    
    return false;
  });
}