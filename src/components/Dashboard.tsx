'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import Sidebar from '@/components/Sidebar';
import ReportsSidebar from '@/components/ReportsSidebar';
import { useGeographic } from '@/contexts/GeographicContext';
import { usePotholeReports } from '@/hooks/usePotholeReports';

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

export default function Dashboard() {
    const [filters, setFilters] = useState<{ district: string | null; mandal: string | null }>({
        district: null,
        mandal: null
    });
    const [showReportsSidebar, setShowReportsSidebar] = useState(false);

    // Use your custom hook to fetch data from /api/reports
    const { reports, isLoading: loading, error } = usePotholeReports();
    
    // Use geographic context for boundary-based filtering
    const { filterReportsByLocation } = useGeographic();

    // Filter reports based on selected district and mandal using geographic boundaries
    const filteredReports = useMemo(() => {
        return filterReportsByLocation(reports, filters.district, filters.mandal);
    }, [reports, filters, filterReportsByLocation]);

    const handleFilterChange = (newFilters: { district: string | null; mandal: string | null }) => {
        setFilters(newFilters);
        // Show reports sidebar when a district or mandal is selected
        setShowReportsSidebar(!!(newFilters.district || newFilters.mandal));
    };

    const handleCloseReportsSidebar = () => {
        setShowReportsSidebar(false);
        // Optionally clear filters when closing sidebar
        setFilters({ district: null, mandal: null });
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
                <Sidebar 
                  reports={reports} 
                  onFilterChange={handleFilterChange}
                  showReportsSidebar={showReportsSidebar}
                />
                
                {/* Reports Sidebar - shows filtered reports for selected area */}
                <ReportsSidebar
                  districtName={filters.district || undefined}
                  mandalName={filters.mandal || undefined}
                  reports={filteredReports}
                  onClose={handleCloseReportsSidebar}
                  isVisible={showReportsSidebar}
                />
                
                <main className="w-full h-full">
                    <MapView 
                        reports={filteredReports} 
                        filters={filters}
                        selectedDistrict={filters.district}
                        selectedMandal={filters.mandal}
                    />
                </main>
            </ClientOnly>
        </div>
    );
}
