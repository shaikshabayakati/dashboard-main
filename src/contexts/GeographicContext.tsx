/**
 * Context for managing geographic data and filtering functionality
 */
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  GeoJSONFeatureCollection, 
  loadGeoJSONData, 
  getDistrictsFromGeoJSON, 
  getMandalsForDistrict,
  filterReportsByGeography,
  NEW_TO_OLD_DISTRICT_NAMES
} from '@/utils/geoUtils';

interface GeographicContextType {
  geoJsonData: GeoJSONFeatureCollection | null;
  districts: string[];
  getMandalsForSelectedDistrict: (district: string) => string[];
  filterReportsByLocation: <T extends { lat: number; lng: number }>(
    reports: T[],
    selectedDistrict?: string | null,
    selectedMandal?: string | null
  ) => T[];
  isLoading: boolean;
  error: string | null;
  highlightedDistrict: string | null;
  highlightedMandal: string | null;
  setHighlightedDistrict: (district: string | null) => void;
  setHighlightedMandal: (mandal: string | null) => void;
  getDistrictBoundary: (districtName: string) => any | null;
  getMandalBoundary: (mandalName: string) => any | null;
  getMandalCenter: (mandalName: string) => { lat: number; lng: number } | null;
}

const GeographicContext = createContext<GeographicContextType | undefined>(undefined);

export function useGeographic() {
  const context = useContext(GeographicContext);
  if (context === undefined) {
    throw new Error('useGeographic must be used within a GeographicProvider');
  }
  return context;
}

interface GeographicProviderProps {
  children: ReactNode;
}

export function GeographicProvider({ children }: GeographicProviderProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedDistrict, setHighlightedDistrict] = useState<string | null>(null);
  const [highlightedMandal, setHighlightedMandal] = useState<string | null>(null);

  useEffect(() => {
    async function loadGeographicData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load the GeoJSON data from the public folder
        const data = await loadGeoJSONData('/ANDHRA PRADESH_SUBDISTRICTS.geojson');
        setGeoJsonData(data);
        
        // Extract unique districts
        const districtList = getDistrictsFromGeoJSON(data);
        setDistricts(districtList);
        
      } catch (err) {
        console.error('Failed to load geographic data:', err);
        setError('Failed to load geographic boundary data');
      } finally {
        setIsLoading(false);
      }
    }

    loadGeographicData();
  }, []);

  const getMandalsForSelectedDistrict = (district: string): string[] => {
    if (!geoJsonData) return [];
    return getMandalsForDistrict(geoJsonData, district);
  };

  const filterReportsByLocation = <T extends { lat: number; lng: number }>(
    reports: T[],
    selectedDistrict?: string | null,
    selectedMandal?: string | null
  ): T[] => {
    if (!geoJsonData) return reports;
    return filterReportsByGeography(reports, geoJsonData, selectedDistrict, selectedMandal);
  };

  const getDistrictBoundary = (districtName: string) => {
    if (!geoJsonData || !geoJsonData.features) {
      console.error('getDistrictBoundary: No geoJsonData available');
      return null;
    }
    
    console.log('getDistrictBoundary called for district:', districtName);
    
    // First try to find district-level features with NAME property
    let districtFeatures = geoJsonData.features.filter((feature: any) => 
      feature.properties.boundary_level === 'district' && feature.properties.NAME === districtName
    );
    
    console.log('Found district-level features:', districtFeatures.length);
    
    // If no district-level features found, get all mandals/sub-districts for this district
    if (districtFeatures.length === 0) {
      // Get the old district name to match against dtname field for mandals
      const oldDistrictName = NEW_TO_OLD_DISTRICT_NAMES[districtName] || districtName;
      console.log('Mapping district name:', districtName, '→', oldDistrictName);
      
      districtFeatures = geoJsonData.features.filter((feature: any) => 
        feature.properties.dtname === oldDistrictName && feature.properties.sdtname
      );
      
      console.log('Found mandal features for', oldDistrictName + ':', districtFeatures.length);
    }
    
    if (districtFeatures.length === 0) {
      console.error('No features found for district:', districtName);
      return null;
    }
    
    console.log('Returning', districtFeatures.length, 'features for district:', districtName);
    
    return {
      type: 'FeatureCollection',
      features: districtFeatures
    };
  };

  const getMandalBoundary = (mandalName: string) => {
    if (!geoJsonData || !geoJsonData.features) {
      return null;
    }
    
    const mandalFeature = geoJsonData.features.find((feature: any) => 
      feature.properties.sdtname === mandalName
    );
    
    if (!mandalFeature) return null;
    
    return {
      type: 'FeatureCollection',
      features: [mandalFeature]
    };
  };

  const getMandalCenter = (mandalName: string): { lat: number; lng: number } | null => {
    if (!geoJsonData || !geoJsonData.features) {
      return null;
    }
    
    const mandalFeature = geoJsonData.features.find((feature: any) => 
      feature.properties.sdtname === mandalName
    );
    
    if (!mandalFeature || !mandalFeature.geometry) {
      return null;
    }
    
    let allCoordinates: [number, number][] = [];
    
    // Handle both Polygon and MultiPolygon geometries
    if (mandalFeature.geometry.type === 'MultiPolygon') {
      // For MultiPolygon, coordinates are [[[polygon1]], [[polygon2]], ...]
      mandalFeature.geometry.coordinates.forEach((polygon: any) => {
        if (polygon[0] && Array.isArray(polygon[0])) {
          allCoordinates.push(...polygon[0]);
        }
      });
    } else if (mandalFeature.geometry.type === 'Polygon') {
      // For Polygon, coordinates are [[exterior_ring], [hole1], [hole2], ...]
      if (mandalFeature.geometry.coordinates[0] && Array.isArray(mandalFeature.geometry.coordinates[0])) {
        allCoordinates = mandalFeature.geometry.coordinates[0];
      }
    }
    
    if (allCoordinates.length === 0) {
      console.error('No valid coordinates found for mandal:', mandalName);
      return null;
    }
    
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;
    
    allCoordinates.forEach((coord: [number, number]) => {
      if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
        totalLng += coord[0];
        totalLat += coord[1];
        pointCount++;
      }
    });
    
    if (pointCount === 0) {
      console.error('No valid coordinate points found for mandal:', mandalName);
      return null;
    }
    
    const center = {
      lat: totalLat / pointCount,
      lng: totalLng / pointCount
    };
    
    // Validate the calculated center
    if (isNaN(center.lat) || isNaN(center.lng)) {
      console.error('Invalid center coordinates calculated for mandal:', mandalName, center);
      return null;
    }
    
    return center;
  };

  const contextValue: GeographicContextType = {
    geoJsonData,
    districts,
    getMandalsForSelectedDistrict,
    filterReportsByLocation,
    isLoading,
    error,
    highlightedDistrict,
    highlightedMandal,
    setHighlightedDistrict,
    setHighlightedMandal,
    getDistrictBoundary,
    getMandalBoundary,
    getMandalCenter
  };

  return (
    <GeographicContext.Provider value={contextValue}>
      {children}
    </GeographicContext.Provider>
  );
}