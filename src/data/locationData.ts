import districtMandalData from './andhra_pradesh_districts_mandals.json';

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

// Proper district coordinates (manually verified)
const districtCoordinates: Record<string, { lat: number; lng: number; zoom: number }> = {
  'anantapur': { lat: 14.6819, lng: 77.6006, zoom: 10 },
  'chittoor': { lat: 13.2172, lng: 79.1003, zoom: 10 },
  'east-godavari': { lat: 17.0005, lng: 81.8040, zoom: 10 },
  'guntur': { lat: 16.3067, lng: 80.4365, zoom: 10 },
  'krishna': { lat: 16.5193, lng: 80.6305, zoom: 10 },
  'kurnool': { lat: 15.8281, lng: 78.0373, zoom: 10 },
  'prakasam': { lat: 15.3500, lng: 79.5833, zoom: 10 },
  'nellore': { lat: 14.4426, lng: 79.9865, zoom: 10 },
  'srikakulam': { lat: 18.2949, lng: 83.8938, zoom: 10 },
  'visakhapatnam': { lat: 17.744575, lng: 83.257080, zoom: 10 },
  'vizianagaram': { lat: 18.1167, lng: 83.4000, zoom: 10 },
  'west-godavari': { lat: 16.7150, lng: 81.1051, zoom: 10 },
  'ysr-kadapa': { lat: 14.4674, lng: 78.8241, zoom: 10 },
  'anakapalli': { lat: 17.6911, lng: 82.9988, zoom: 11 },
  'annamayya': { lat: 13.6667, lng: 79.3333, zoom: 11 },
  'bapatla': { lat: 15.9042, lng: 80.4671, zoom: 11 },
  'eluru': { lat: 16.7107, lng: 81.0950, zoom: 11 },
  'kakinada': { lat: 16.9891, lng: 82.2475, zoom: 11 },
  'konaseema': { lat: 16.9333, lng: 81.9000, zoom: 11 },
  'ntr': { lat: 16.5193, lng: 80.6305, zoom: 11 },
  'palnadu': { lat: 16.1667, lng: 79.9667, zoom: 11 },
  'parvathipuram-manyam': { lat: 18.7833, lng: 83.4333, zoom: 11 },
  'alluri-sitharama-raju': { lat: 17.7500, lng: 82.0000, zoom: 10 },
  'nandyal': { lat: 15.4769, lng: 78.4833, zoom: 11 },
  'sri-satya-sai': { lat: 14.1667, lng: 77.4833, zoom: 11 },
  'tirupati': { lat: 13.6288, lng: 79.4192, zoom: 11 },
  'dr-br-ambedkar-konaseema': { lat: 16.9333, lng: 81.9000, zoom: 11 },
  'parvathipuram': { lat: 18.7833, lng: 83.4333, zoom: 11 }
};

// Transform JSON data to District format with proper coordinates
export const andhraPradeshDistricts: District[] = Object.entries(districtMandalData).map(([districtName, data]: [string, any]) => {
  const districtId = districtName.toLowerCase().replace(/\s+/g, '-');
  const coords = districtCoordinates[districtId];
  
  return {
    id: districtId,
    name: districtName,
    lat: coords?.lat || data.coordinates.latitude,
    lng: coords?.lng || data.coordinates.longitude,
    zoom: coords?.zoom || 10
  };
});

// Transform JSON data to Mandal format
export const andhraPradeshMandals: Mandal[] = Object.entries(districtMandalData).flatMap(([districtName, data]: [string, any]) => {
  const districtId = districtName.toLowerCase().replace(/\s+/g, '-');
  return data.mandals.map((mandal: any, index: number) => ({
    id: `${districtId}-${mandal.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    name: mandal.name,
    districtId: districtId,
    lat: mandal.coordinates.latitude,
    lng: mandal.coordinates.longitude
  }));
});

// Get mandals by district ID
export function getMandalsByDistrict(districtId: string): Mandal[] {
  return andhraPradeshMandals.filter(mandal => mandal.districtId === districtId);
}

// Default center for Andhra Pradesh state
export const defaultStateCenter: District = {
  id: 'andhra-pradesh',
  name: 'Andhra Pradesh',
  lat: 15.9129,
  lng: 79.7400,
  zoom: 7
};
