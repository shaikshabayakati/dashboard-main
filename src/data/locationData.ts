import { extractDistricts, extractMandals, getMandalsByDistrictId } from '@/utils/geoJsonParser';

export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom?: number;
}

export interface Mandal {
  id: string;
  name: string;
  districtId: string;
  lat: number;
  lng: number;
}

// These will be populated asynchronously from GeoJSON
let districtsCache: District[] = [];
let mandalsCache: Mandal[] = [];
let isLoading = false;
let isLoaded = false;

// Initialize data from GeoJSON
async function initializeData() {
  if (isLoaded || isLoading) return;
  
  // Only load in browser
  if (typeof window === 'undefined') {
    return;
  }
  
  isLoading = true;
  try {
    const [districts, mandals] = await Promise.all([
      extractDistricts(),
      extractMandals()
    ]);
    
    districtsCache = districts;
    mandalsCache = mandals;
    isLoaded = true;
  } catch (error) {
    console.error('Error loading district/mandal data:', error);
  } finally {
    isLoading = false;
  }
}

// Start loading immediately in browser
if (typeof window !== 'undefined') {
  initializeData();
}

// Get all districts (returns promise)
export async function getDistricts(): Promise<District[]> {
  if (!isLoaded) {
    await initializeData();
  }
  return districtsCache;
}

// Get all mandals (returns promise)
export async function getMandals(): Promise<Mandal[]> {
  if (!isLoaded) {
    await initializeData();
  }
  return mandalsCache;
}

// Synchronous access for backwards compatibility (may return empty array initially)
export const andhraPradeshDistricts: District[] = districtsCache;
export const andhraPradeshMandals: Mandal[] = mandalsCache;

// Get mandals by district ID (synchronous version)
export function getMandalsByDistrict(districtId: string): Mandal[] {
  return mandalsCache.filter(mandal => mandal.districtId === districtId);
}

// Get mandals by district ID (async version)
export async function getMandalsByDistrictAsync(districtId: string): Promise<Mandal[]> {
  return getMandalsByDistrictId(districtId);
}

// Default center for Andhra Pradesh state
export const defaultStateCenter: District = {
  id: 'andhra-pradesh',
  name: 'Andhra Pradesh',
  lat: 15.9129,
  lng: 79.7400,
  zoom: 7
};
