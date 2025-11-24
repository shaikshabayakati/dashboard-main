"use client";
import { useEffect, useState, useCallback } from 'react';
import { PotholeReport } from '../types/PotholeReport';

// Sample data for demonstration
const sampleReports: PotholeReport[] = [
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
    district: 'Hyderabad',
    subDistrict: 'Banjara Hills',
    location: 'Road No. 12, Banjara Hills'
  },
  {
    id: '2',
    lat: 17.4065,
    lng: 78.4772,
    severity: 0.6,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Medium+Pothole'],
    description: 'Multiple small potholes near the intersection',
    status: 'triaged',
    reporter_id: 'user_002',
    reporter_phone: '+91-9876543211',
    district: 'Hyderabad',
    subDistrict: 'Madhapur',
    location: 'HITEC City Main Road'
  },
  {
    id: '3',
    lat: 17.4435,
    lng: 78.3772,
    severity: 0.4,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Minor+Pothole'],
    description: 'Minor pothole near bus stop',
    status: 'assigned',
    reporter_id: 'user_003',
    reporter_phone: '+91-9876543212',
    district: 'Hyderabad',
    subDistrict: 'Kukatpally',
    location: 'KPHB Colony, Main Road'
  },
  {
    id: '4',
    lat: 16.5062,
    lng: 80.6480,
    severity: 0.9,
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/D63031/FFFFFF?text=Critical+Pothole'],
    description: 'Critical pothole causing vehicle damage',
    status: 'new',
    reporter_id: 'user_004',
    reporter_phone: '+91-9876543213',
    district: 'Krishna',
    subDistrict: 'Vijayawada',
    location: 'MG Road, Vijayawada'
  },
  {
    id: '5',
    lat: 17.6868,
    lng: 83.2185,
    severity: 0.7,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Large+Pothole'],
    description: 'Deep pothole affecting both lanes',
    status: 'triaged',
    reporter_id: 'user_005',
    reporter_phone: '+91-9876543214',
    district: 'Visakhapatnam',
    subDistrict: 'MVP Colony',
    location: 'Beach Road, Visakhapatnam'
  },
  {
    id: '6',
    lat: 17.3900,
    lng: 78.4800,
    severity: 0.5,
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Moderate+Pothole'],
    description: 'Pothole expanding near residential area',
    status: 'assigned',
    reporter_id: 'user_006',
    reporter_phone: '+91-9876543215',
    district: 'Hyderabad',
    subDistrict: 'Jubilee Hills',
    location: 'Road No. 36, Jubilee Hills'
  },
  {
    id: '7',
    lat: 17.4500,
    lng: 78.3800,
    severity: 0.3,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Small+Pothole'],
    description: 'Small pothole near school zone',
    status: 'fixed',
    reporter_id: 'user_007',
    reporter_phone: '+91-9876543216',
    district: 'Hyderabad',
    subDistrict: 'Miyapur',
    location: 'Bachupally Road'
  },
  {
    id: '8',
    lat: 13.6288,
    lng: 79.4192,
    severity: 0.8,
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Severe+Damage'],
    description: 'Severe road damage near temple area',
    status: 'new',
    reporter_id: 'user_008',
    reporter_phone: '+91-9876543217',
    district: 'Tirupati',
    subDistrict: 'Tirupati Urban',
    location: 'Tirumala Road'
  },
  {
    id: '9',
    lat: 16.9891,
    lng: 82.2475,
    severity: 0.6,
    timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Medium+Issue'],
    description: 'Medium-sized pothole near market area',
    status: 'triaged',
    reporter_id: 'user_009',
    reporter_phone: '+91-9876543218',
    district: 'Kakinada',
    subDistrict: 'Kakinada City',
    location: 'Main Bazar Road'
  },
  {
    id: '10',
    lat: 17.4000,
    lng: 78.4900,
    severity: 0.4,
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Minor+Issue'],
    description: 'Minor road irregularity reported',
    status: 'assigned',
    reporter_id: 'user_010',
    reporter_phone: '+91-9876543219',
    district: 'Hyderabad',
    subDistrict: 'Gachibowli',
    location: 'DLF Cyber City Road'
  },
  {
    id: '11',
    lat: 17.3700,
    lng: 78.5000,
    severity: 0.7,
    timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Large+Pothole'],
    description: 'Large pothole causing water logging',
    status: 'new',
    reporter_id: 'user_011',
    reporter_phone: '+91-9876543220',
    district: 'Hyderabad',
    subDistrict: 'LB Nagar',
    location: 'Outer Ring Road'
  },
  {
    id: '12',
    lat: 17.4200,
    lng: 78.4500,
    severity: 0.5,
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://via.placeholder.com/400x300/FFB84D/FFFFFF?text=Moderate+Damage'],
    description: 'Road surface deterioration observed',
    status: 'triaged',
    reporter_id: 'user_012',
    reporter_phone: '+91-9876543221',
    district: 'Hyderabad',
    subDistrict: 'Kondapur',
    location: 'APHB Colony Road'
  }
];

export function usePotholeReports() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use sample data instead of fetching from API
      // Simulate a slight delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set the sample data
      setReports(sampleReports);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { reports, isLoading, error, refetch: fetchData };
}