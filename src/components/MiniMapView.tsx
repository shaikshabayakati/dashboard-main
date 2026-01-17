'use client';

import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, HeatmapLayer } from '@react-google-maps/api';
import { GeneralIssue } from '@/types/GeneralIssue';

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places', 'visualization'];

interface MiniMapViewProps {
    issues: GeneralIssue[];
}

const MiniMapView: React.FC<MiniMapViewProps> = ({ issues }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    // Center on Vizag
    const center = useMemo(() => ({
        lat: 17.6868,
        lng: 83.2185
    }), []);

    const mapOptions: google.maps.MapOptions = useMemo(() => ({
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        disableDefaultUI: true
    }), []);

    // Filter issues with valid coordinates
    const validIssues = useMemo(() =>
        issues.filter(issue =>
            (issue.latitude !== null && issue.latitude !== undefined) &&
            (issue.longitude !== null && issue.longitude !== undefined)
        ),
        [issues]
    );

    // Prepare heatmap data
    const heatmapData = useMemo(() => {
        if (!isLoaded || !window.google || validIssues.length === 0) return [];

        return validIssues.map(issue => ({
            location: new google.maps.LatLng(issue.latitude!, issue.longitude!),
            weight: 1
        }));
    }, [validIssues, isLoaded]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-gray-500 text-sm animate-pulse">Loading map...</div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={11}
            options={mapOptions}
        >
            {/* Heatmap Layer */}
            {heatmapData.length > 0 && (
                <HeatmapLayer
                    data={heatmapData}
                    options={{
                        radius: 30,
                        opacity: 0.8,
                        dissipating: true,
                        gradient: [
                            'rgba(0, 255, 255, 0)',
                            'rgba(0, 255, 255, 1)',
                            'rgba(0, 191, 255, 1)',
                            'rgba(0, 127, 255, 1)',
                            'rgba(0, 63, 255, 1)',
                            'rgba(0, 0, 255, 1)',
                            'rgba(0, 0, 223, 1)',
                            'rgba(0, 0, 191, 1)',
                            'rgba(0, 0, 159, 1)',
                            'rgba(0, 0, 127, 1)',
                            'rgba(63, 0, 91, 1)',
                            'rgba(127, 0, 63, 1)',
                            'rgba(191, 0, 31, 1)',
                            'rgba(255, 0, 0, 1)'
                        ]
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default MiniMapView;
