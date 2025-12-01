'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import Sidebar from '@/components/Sidebar';
import { District } from '@/data/locationData';
import { usePotholeReports } from '../hooks/usePotholeReports';

// Dynamically import MapView to prevent SSR issues
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  
  // Use your custom hook to fetch data from /api/reports
  const { reports, isLoading: loading, error } = usePotholeReports();

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-50 relative">
      <ClientOnly
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-600">Initializing dashboard...</div>
          </div>
        }
      >
        <Sidebar onDistrictSelect={handleDistrictSelect} />
        <main className="w-full h-full">
          <MapView reports={reports} selectedDistrict={selectedDistrict} />
        </main>
      </ClientOnly>
    </div>
  );
}
