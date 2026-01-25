'use client';

import React, { useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, HeatmapLayer, InfoWindow } from '@react-google-maps/api';
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

    const [selectedIssue, setSelectedIssue] = useState<GeneralIssue | null>(null);

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
        disableDefaultUI: true,
        gestureHandling: 'greedy', // Disable Ctrl+zoom requirement
        scrollwheel: false // Disable scroll wheel zoom completely
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

    // Get marker color based on severity
    const getMarkerColor = (severity?: string | null): string => {
        if (!severity) return '#3B82F6'; // blue for unknown
        const s = severity.toLowerCase();
        if (s.includes('high')) return '#DC2626'; // red
        if (s.includes('medium')) return '#F59E0B'; // orange
        return '#3B82F6'; // blue for low
    };

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
                        opacity: 0.6,
                        dissipating: true
                    }}
                />
            )}

            {/* Individual Markers */}
            {validIssues.map((issue) => (
                <Marker
                    key={issue.id}
                    position={{
                        lat: issue.latitude!,
                        lng: issue.longitude!
                    }}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: getMarkerColor(issue.severity),
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 6
                    }}
                    onClick={() => setSelectedIssue(issue)}
                />
            ))}

            {/* Info Window for selected marker */}
            {selectedIssue && (
                <InfoWindow
                    position={{
                        lat: selectedIssue.latitude!,
                        lng: selectedIssue.longitude!
                    }}
                    onCloseClick={() => setSelectedIssue(null)}
                >
                    <div className="p-2">
                        <div className="font-semibold text-sm text-slate-900">
                            {selectedIssue.primaryIssue || 'Unknown Issue'}
                        </div>
                        {selectedIssue.subCategory && (
                            <div className="text-xs text-slate-600 mt-1">
                                {selectedIssue.subCategory}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                            Ward {selectedIssue.wardNumber || 'N/A'}
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default MiniMapView;
