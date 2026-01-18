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
    const [heatmapPoints, setHeatmapPoints] = React.useState<google.maps.visualization.WeightedLocation[]>([]);

    React.useEffect(() => {
        if (isLoaded && window.google && validIssues.length > 0) {
            try {
                const points = validIssues.map(issue => ({
                    location: new google.maps.LatLng(issue.latitude!, issue.longitude!),
                    weight: 1
                }));
                setHeatmapPoints(points);
            } catch (err) {
                console.error("Error creating heatmap points:", err);
            }
        }
    }, [isLoaded, validIssues]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 animate-pulse">
                <div className="text-gray-400 text-sm font-medium">Initializing Map...</div>
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
            {heatmapPoints.length > 0 && (
                <HeatmapLayer
                    data={heatmapPoints}
                    options={{
                        radius: 40,
                        opacity: 0.8,
                        dissipating: true
                    }}
                />
            )}


        </GoogleMap>
    );
};

export default MiniMapView;
