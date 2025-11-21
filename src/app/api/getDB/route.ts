import { NextResponse } from 'next/server';
import { PotholeReport } from '@/types/PotholeReport';

// Sample pothole reports data for Andhra Pradesh
const andhrapradeshPotholeReports: PotholeReport[] = [
  {
    id: '1',
    lat: 17.3850,
    lng: 78.4867,
    severity: 0.8,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Severe+Pothole'],
    description: 'Large pothole on main road causing traffic issues',
    status: 'new',
    reporter_id: 'user_001',
    reporter_phone: '+91-9876543210',
    district: 'hyderabad',
    subDistrict: 'Banjara Hills',
    location: 'Road No. 12, Banjara Hills'
  },
  {
    id: '2',
    lat: 16.5062,
    lng: 80.6480,
    severity: 0.9,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/D63031/FFFFFF?text=Critical+Pothole'],
    description: 'Critical pothole causing vehicle damage',
    status: 'new',
    reporter_id: 'user_002',
    reporter_phone: '+91-9876543211',
    district: 'Krishna',
    subDistrict: 'Vijayawada',
    location: 'MG Road, Vijayawada'
  },
  {
    id: '3',
    lat: 17.6868,
    lng: 83.2185,
    severity: 0.7,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Large+Pothole'],
    description: 'Deep pothole affecting both lanes',
    status: 'triaged',
    reporter_id: 'user_003',
    reporter_phone: '+91-9876543212',
    district: 'Visakhapatnam',
    subDistrict: 'MVP Colony',
    location: 'Beach Road, Visakhapatnam'
  },
  {
    id: '4',
    lat: 13.6288,
    lng: 79.4192,
    severity: 0.8,
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Severe+Damage'],
    description: 'Severe road damage near temple area',
    status: 'new',
    reporter_id: 'user_004',
    reporter_phone: '+91-9876543213',
    district: 'Tirupati',
    subDistrict: 'Tirupati Urban',
    location: 'Tirumala Road'
  },
  {
    id: '5',
    lat: 16.9891,
    lng: 82.2475,
    severity: 0.6,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Medium+Issue'],
    description: 'Medium-sized pothole near market area',
    status: 'triaged',
    reporter_id: 'user_005',
    reporter_phone: '+91-9876543214',
    district: 'Kakinada',
    subDistrict: 'Kakinada City',
    location: 'Main Bazar Road'
  },
  {
    id: '6',
    lat: 14.6819,
    lng: 77.6006,
    severity: 0.5,
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Moderate+Pothole'],
    description: 'Pothole expanding near residential area',
    status: 'assigned',
    reporter_id: 'user_006',
    reporter_phone: '+91-9876543215',
    district: 'Anantapur',
    subDistrict: 'Anantapur City',
    location: 'Railway Station Road'
  },
  {
    id: '7',
    lat: 16.3067,
    lng: 80.4365,
    severity: 0.4,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Minor+Pothole'],
    description: 'Small pothole near bus stand',
    status: 'fixed',
    reporter_id: 'user_007',
    reporter_phone: '+91-9876543216',
    district: 'Guntur',
    subDistrict: 'Guntur City',
    location: 'Collectorate Road'
  },
  {
    id: '8',
    lat: 13.2172,
    lng: 79.1003,
    severity: 0.7,
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Large+Damage'],
    description: 'Large pothole near government hospital',
    status: 'new',
    reporter_id: 'user_008',
    reporter_phone: '+91-9876543217',
    district: 'Chittoor',
    subDistrict: 'Chittoor City',
    location: 'Hospital Road'
  },
  {
    id: '9',
    lat: 15.8281,
    lng: 78.0373,
    severity: 0.6,
    timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Medium+Issue'],
    description: 'Pothole causing drainage issues',
    status: 'triaged',
    reporter_id: 'user_009',
    reporter_phone: '+91-9876543218',
    district: 'Kurnool',
    subDistrict: 'Kurnool City',
    location: 'Main Market Road'
  },
  {
    id: '10',
    lat: 18.2949,
    lng: 83.8938,
    severity: 0.5,
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Minor+Issue'],
    description: 'Minor road irregularity reported',
    status: 'assigned',
    reporter_id: 'user_010',
    reporter_phone: '+91-9876543219',
    district: 'Srikakulam',
    subDistrict: 'Srikakulam City',
    location: 'Beach Road'
  },
  {
    id: '11',
    lat: 14.4426,
    lng: 79.9865,
    severity: 0.8,
    timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Severe+Pothole'],
    description: 'Large pothole causing water logging',
    status: 'new',
    reporter_id: 'user_011',
    reporter_phone: '+91-9876543220',
    district: 'Nellore',
    subDistrict: 'Nellore City',
    location: 'NH5 Highway'
  },
  {
    id: '12',
    lat: 18.1167,
    lng: 83.4000,
    severity: 0.4,
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Small+Damage'],
    description: 'Small road damage near college',
    status: 'assigned',
    reporter_id: 'user_012',
    reporter_phone: '+91-9876543221',
    district: 'Vizianagaram',
    subDistrict: 'Vizianagaram City',
    location: 'College Road'
  }
];

export async function GET() {
  try {
    // Return sample data for Andhra Pradesh
    return NextResponse.json({ 
      reports: andhrapradeshPotholeReports,
      message: 'Sample data for Andhra Pradesh pothole reports'
    });
  } catch (error) {
    console.error('Error returning sample data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}