export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom?: number;
}

export const andhraPradeshDistricts: District[] = [
  { id: 'anantapur', name: 'Anantapur', lat: 14.6819, lng: 77.6006, zoom: 10 },
  { id: 'chittoor', name: 'Chittoor', lat: 13.2172, lng: 79.1003, zoom: 10 },
  { id: 'east-godavari', name: 'East Godavari', lat: 17.0005, lng: 81.8040, zoom: 10 },
  { id: 'guntur', name: 'Guntur', lat: 16.3067, lng: 80.4365, zoom: 10 },
  { id: 'krishna', name: 'Krishna', lat: 16.5193, lng: 80.6305, zoom: 10 },
  { id: 'kurnool', name: 'Kurnool', lat: 15.8281, lng: 78.0373, zoom: 10 },
  { id: 'prakasam', name: 'Prakasam', lat: 15.3500, lng: 79.5833, zoom: 10 },
  { id: 'nellore', name: 'Nellore', lat: 14.4426, lng: 79.9865, zoom: 10 },
  { id: 'srikakulam', name: 'Srikakulam', lat: 18.2949, lng: 83.8938, zoom: 10 },
  { id: 'visakhapatnam', name: 'Visakhapatnam', lat: 17.6869, lng: 83.2185, zoom: 10 },
  { id: 'vizianagaram', name: 'Vizianagaram', lat: 18.1167, lng: 83.4000, zoom: 10 },
  { id: 'west-godavari', name: 'West Godavari', lat: 16.7150, lng: 81.1051, zoom: 10 },
  { id: 'ysr-kadapa', name: 'YSR Kadapa', lat: 14.4674, lng: 78.8241, zoom: 10 },
  { id: 'anakapalli', name: 'Anakapalli', lat: 17.6911, lng: 82.9988, zoom: 11 },
  { id: 'annamayya', name: 'Annamayya', lat: 13.6667, lng: 79.3333, zoom: 11 },
  { id: 'bapatla', name: 'Bapatla', lat: 15.9042, lng: 80.4671, zoom: 11 },
  { id: 'eluru', name: 'Eluru', lat: 16.7107, lng: 81.0950, zoom: 11 },
  { id: 'kakinada', name: 'Kakinada', lat: 16.9891, lng: 82.2475, zoom: 11 },
  { id: 'konaseema', name: 'Konaseema', lat: 16.9333, lng: 81.9000, zoom: 11 },
  { id: 'ntr', name: 'NTR', lat: 16.5193, lng: 80.6305, zoom: 11 },
  { id: 'palnadu', name: 'Palnadu', lat: 16.1667, lng: 79.9667, zoom: 11 },
  { id: 'parvathipuram-manyam', name: 'Parvathipuram Manyam', lat: 18.7833, lng: 83.4333, zoom: 11 },
  { id: 'alluri-sitharama-raju', name: 'Alluri Sitharama Raju', lat: 17.7500, lng: 82.0000, zoom: 10 },
  { id: 'nandyal', name: 'Nandyal', lat: 15.4769, lng: 78.4833, zoom: 11 },
  { id: 'sri-satya-sai', name: 'Sri Satya Sai', lat: 14.1667, lng: 77.4833, zoom: 11 },
  { id: 'tirupati', name: 'Tirupati', lat: 13.6288, lng: 79.4192, zoom: 11 },
  { id: 'dr-br-ambedkar-konaseema', name: 'Dr. B.R. Ambedkar Konaseema', lat: 16.9333, lng: 81.9000, zoom: 11 },
  { id: 'parvathipuram', name: 'Parvathipuram', lat: 18.7833, lng: 83.4333, zoom: 11 }
];

// Default center for Andhra Pradesh state
export const defaultStateCenter: District = {
  id: 'andhra-pradesh',
  name: 'Andhra Pradesh',
  lat: 15.9129,
  lng: 79.7400,
  zoom: 7
};
