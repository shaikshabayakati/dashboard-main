// Mandals/Cities data for Andhra Pradesh districts
export interface Mandal {
  id: string;
  name: string;
  districtId: string;
  lat: number;
  lng: number;
}

export const andhraPradeshMandals: Mandal[] = [
  // Visakhapatnam District
  { id: 'vizag-city', name: 'Visakhapatnam (Urban)', districtId: 'visakhapatnam', lat: 17.6869, lng: 83.2185 },
  { id: 'gajuwaka', name: 'Gajuwaka', districtId: 'visakhapatnam', lat: 17.7000, lng: 83.2100 },
  { id: 'madhurawada', name: 'Madhurawada', districtId: 'visakhapatnam', lat: 17.7833, lng: 83.3833 },
  { id: 'bheemunipatnam', name: 'Bheemunipatnam', districtId: 'visakhapatnam', lat: 17.8886, lng: 83.4503 },
  { id: 'anakapalle', name: 'Anakapalle', districtId: 'visakhapatnam', lat: 17.6911, lng: 82.9988 },
  { id: 'narsipatnam', name: 'Narsipatnam', districtId: 'visakhapatnam', lat: 17.6671, lng: 82.6127 },
  { id: 'yelamanchili', name: 'Yelamanchili', districtId: 'visakhapatnam', lat: 17.8407, lng: 83.0006 },
  { id: 'chodavaram', name: 'Chodavaram', districtId: 'visakhapatnam', lat: 17.8274, lng: 82.9468 },
  { id: 'paderu', name: 'Paderu', districtId: 'visakhapatnam', lat: 17.7275, lng: 82.6554 },

  // Anakapalli District
  { id: 'anakapalli-city', name: 'Anakapalli (Urban)', districtId: 'anakapalli', lat: 17.6911, lng: 82.9988 },
  { id: 'kasimkota', name: 'Kasimkota', districtId: 'anakapalli', lat: 17.6911, lng: 83.1000 },
  { id: 'makavarapalem', name: 'Makavarapalem', districtId: 'anakapalli', lat: 17.7500, lng: 83.0500 },

  // East Godavari District
  { id: 'kakinada-city', name: 'Kakinada', districtId: 'east-godavari', lat: 16.9891, lng: 82.2475 },
  { id: 'rajahmundry', name: 'Rajahmundry', districtId: 'east-godavari', lat: 17.0005, lng: 81.8040 },
  { id: 'amalapuram', name: 'Amalapuram', districtId: 'east-godavari', lat: 16.5791, lng: 82.0074 },
  { id: 'tuni', name: 'Tuni', districtId: 'east-godavari', lat: 17.3592, lng: 82.5469 },
  { id: 'pithapuram', name: 'Pithapuram', districtId: 'east-godavari', lat: 17.1167, lng: 82.2500 },

  // Kakinada District
  { id: 'kakinada-urban', name: 'Kakinada (Urban)', districtId: 'kakinada', lat: 16.9891, lng: 82.2475 },
  { id: 'peddapuram', name: 'Peddapuram', districtId: 'kakinada', lat: 17.0770, lng: 82.1386 },
  { id: 'prathipadu', name: 'Prathipadu', districtId: 'kakinada', lat: 17.1833, lng: 82.2667 },

  // West Godavari District
  { id: 'eluru-city', name: 'Eluru', districtId: 'west-godavari', lat: 16.7107, lng: 81.0950 },
  { id: 'tadepalligudem', name: 'Tadepalligudem', districtId: 'west-godavari', lat: 16.8150, lng: 81.5270 },
  { id: 'bhimavaram', name: 'Bhimavaram', districtId: 'west-godavari', lat: 16.5449, lng: 81.5212 },
  { id: 'tanuku', name: 'Tanuku', districtId: 'west-godavari', lat: 16.7581, lng: 81.6811 },

  // Krishna District
  { id: 'vijayawada', name: 'Vijayawada', districtId: 'krishna', lat: 16.5062, lng: 80.6480 },
  { id: 'machilipatnam', name: 'Machilipatnam', districtId: 'krishna', lat: 16.1873, lng: 81.1382 },
  { id: 'gudivada', name: 'Gudivada', districtId: 'krishna', lat: 16.4349, lng: 80.9972 },
  { id: 'nuzvid', name: 'Nuzvid', districtId: 'krishna', lat: 16.7889, lng: 80.8453 },

  // NTR District
  { id: 'vijayawada-ntr', name: 'Vijayawada (NTR)', districtId: 'ntr', lat: 16.5193, lng: 80.6305 },
  { id: 'gannavaram', name: 'Gannavaram', districtId: 'ntr', lat: 16.5417, lng: 80.8044 },
  { id: 'mylavaram', name: 'Mylavaram', districtId: 'ntr', lat: 16.6031, lng: 80.6493 },

  // Guntur District
  { id: 'guntur-city', name: 'Guntur', districtId: 'guntur', lat: 16.3067, lng: 80.4365 },
  { id: 'tenali', name: 'Tenali', districtId: 'guntur', lat: 16.2428, lng: 80.6428 },
  { id: 'narasaraopet', name: 'Narasaraopet', districtId: 'guntur', lat: 16.2355, lng: 80.0481 },
  { id: 'sattenapalle', name: 'Sattenapalle', districtId: 'guntur', lat: 16.3959, lng: 80.1502 },

  // Prakasam District
  { id: 'ongole', name: 'Ongole', districtId: 'prakasam', lat: 15.5057, lng: 80.0499 },
  { id: 'chirala', name: 'Chirala', districtId: 'prakasam', lat: 15.8239, lng: 80.3520 },
  { id: 'markapur', name: 'Markapur', districtId: 'prakasam', lat: 15.7353, lng: 79.2699 },

  // Nellore District
  { id: 'nellore-city', name: 'Nellore', districtId: 'nellore', lat: 14.4426, lng: 79.9865 },
  { id: 'gudur', name: 'Gudur', districtId: 'nellore', lat: 14.1501, lng: 79.8512 },
  { id: 'kavali', name: 'Kavali', districtId: 'nellore', lat: 14.9142, lng: 79.9953 },

  // Chittoor District
  { id: 'tirupati', name: 'Tirupati', districtId: 'chittoor', lat: 13.6288, lng: 79.4192 },
  { id: 'chittoor-city', name: 'Chittoor', districtId: 'chittoor', lat: 13.2172, lng: 79.1003 },
  { id: 'madanapalle', name: 'Madanapalle', districtId: 'chittoor', lat: 13.5503, lng: 78.5026 },
  { id: 'puttur', name: 'Puttur', districtId: 'chittoor', lat: 13.4415, lng: 79.5533 },

  // Anantapur District
  { id: 'anantapur-city', name: 'Anantapur', districtId: 'anantapur', lat: 14.6819, lng: 77.6006 },
  { id: 'hindupur', name: 'Hindupur', districtId: 'anantapur', lat: 13.8283, lng: 77.4911 },
  { id: 'guntakal', name: 'Guntakal', districtId: 'anantapur', lat: 15.1658, lng: 77.3790 },

  // Kurnool District
  { id: 'kurnool-city', name: 'Kurnool', districtId: 'kurnool', lat: 15.8281, lng: 78.0373 },
  { id: 'nandyal-city', name: 'Nandyal', districtId: 'kurnool', lat: 15.4769, lng: 78.4833 },
  { id: 'adoni', name: 'Adoni', districtId: 'kurnool', lat: 15.6295, lng: 77.2750 },

  // YSR Kadapa District
  { id: 'kadapa-city', name: 'Kadapa', districtId: 'ysr-kadapa', lat: 14.4674, lng: 78.8241 },
  { id: 'proddatur', name: 'Proddatur', districtId: 'ysr-kadapa', lat: 14.7502, lng: 78.5481 },
  { id: 'rajampet', name: 'Rajampet', districtId: 'ysr-kadapa', lat: 14.1935, lng: 79.1581 },

  // Srikakulam District
  { id: 'srikakulam-city', name: 'Srikakulam', districtId: 'srikakulam', lat: 18.2949, lng: 83.8938 },
  { id: 'amadalavalasa', name: 'Amadalavalasa', districtId: 'srikakulam', lat: 18.4117, lng: 83.9023 },
  { id: 'palasa', name: 'Palasa', districtId: 'srikakulam', lat: 18.7733, lng: 84.4101 },

  // Vizianagaram District
  { id: 'vizianagaram-city', name: 'Vizianagaram', districtId: 'vizianagaram', lat: 18.1167, lng: 83.4000 },
  { id: 'bobbili', name: 'Bobbili', districtId: 'vizianagaram', lat: 18.5731, lng: 83.3604 },
  { id: 'parvathipuram-city', name: 'Parvathipuram', districtId: 'vizianagaram', lat: 18.7833, lng: 83.4333 },
];

// Helper function to get mandals for a specific district
export function getMandalsByDistrict(districtId: string): Mandal[] {
  return andhraPradeshMandals.filter(mandal => mandal.districtId === districtId);
}
