'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import VizagSidebar from '@/components/VizagSidebar';
import GeneralIssuesSidebar from '@/components/GeneralIssuesSidebar';
import { useCombinedIssues } from '@/hooks/useCombinedIssues';
import { PrimaryIssueType } from '@/types/GeneralIssue';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'] });

// Dynamically import VizagMapView to prevent SSR issues
const VizagMapView = dynamic(() => import('@/components/VizagMapView'), {
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

export default function VizagMapPage() {
    const [filters, setFilters] = useState<{
        ward: number | null;
        zone: string | null;
        issueType: PrimaryIssueType | null
    }>({
        ward: null,
        zone: null,
        issueType: null
    });
    const [showIssuesSidebar, setShowIssuesSidebar] = useState(false);

    // Use custom hook to fetch combined issues (general issues + pothole reports)
    const { issues, isLoading: loading, error } = useCombinedIssues();

    // Filter issues based on selected ward, zone, and issue type
    const filteredIssues = useMemo(() => {
        let filtered = issues;

        if (filters.ward) {
            filtered = filtered.filter(issue => issue.wardNumber === filters.ward);
        }

        if (filters.zone) {
            filtered = filtered.filter(issue => issue.zone === filters.zone);
        }

        if (filters.issueType) {
            filtered = filtered.filter(issue => issue.primaryIssue === filters.issueType);
        }

        return filtered;
    }, [issues, filters]);

    const handleFilterChange = (newFilters: {
        ward: number | null;
        zone: string | null;
        issueType: PrimaryIssueType | null
    }) => {
        setFilters(newFilters);
        // Show issues sidebar when any filter is selected
        setShowIssuesSidebar(!!(newFilters.ward || newFilters.zone || newFilters.issueType));
    };

    const handleCloseIssuesSidebar = () => {
        setShowIssuesSidebar(false);
    };

    if (loading) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center bg-gray-50 ${outfit.className}`}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-600 font-medium">Loading Visakhapatnam Map...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center bg-gray-50 ${outfit.className}`}>
                <div className="text-center max-w-md">
                    <div className="text-red-600 text-xl font-bold mb-2">Error Loading Map</div>
                    <div className="text-gray-600">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen w-screen bg-gray-50 relative ${outfit.className}`}>
            <ClientOnly
                fallback={
                    <div className={`h-screen w-screen flex items-center justify-center bg-gray-50 ${outfit.className}`}>
                        <div className="text-gray-600">Initializing map...</div>
                    </div>
                }
            >
                <VizagSidebar
                    issues={issues}
                    onFilterChange={handleFilterChange}
                    showIssuesSidebar={showIssuesSidebar}
                />

                {/* Issues Sidebar - shows filtered issues for selected area */}
                <GeneralIssuesSidebar
                    wardNumber={filters.ward || undefined}
                    zoneName={filters.zone || undefined}
                    issues={filteredIssues}
                    onClose={handleCloseIssuesSidebar}
                    isVisible={showIssuesSidebar}
                />

                <main className="w-full h-full">
                    <VizagMapView
                        issues={filteredIssues}
                        selectedWard={filters.ward}
                        selectedZone={filters.zone}
                    />
                </main>
            </ClientOnly>
        </div>
    );
}
