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
        issues.filter(issue => issue.latitude && issue.longitude),
        [issues]
    );

    // Prepare heatmap data
    const heatmapData = useMemo(() => {
        if (!isLoaded || !window.google) return [];
        return validIssues.map(issue =>
            new google.maps.LatLng(issue.latitude!, issue.longitude!)
        );
    }, [validIssues, isLoaded]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-gray-500 text-sm">Loading map...</div>
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
                        radius: 20,
                        opacity: 0.6
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default MiniMapView;
