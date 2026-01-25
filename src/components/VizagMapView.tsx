'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, HeatmapLayer, Marker } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { GeneralIssue } from '@/types/GeneralIssue';
import GeneralIssueCard from './GeneralIssueCard';
import { getPriorityColor } from '@/utils/generalIssueHelpers';

interface VizagMapViewProps {
    issues: GeneralIssue[];
    selectedWard?: number | null;
    selectedZone?: string | null;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ['places', 'visualization'];

const vizagCenter = {
    lat: 17.6869,
    lng: 83.2185
};

// Helper to create SVG icon for Issue Marker
const createIssueIcon = (color: string, label: string) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}" />
      <circle cx="15" cy="15" r="8" fill="white" />
      <text x="15" y="19" font-size="12" font-weight="bold" font-family="Arial" text-anchor="middle" fill="${color}">${label}</text>
    </svg>
  `;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(30, 40),
        labelOrigin: new google.maps.Point(15, 15)
    };
};

// Helper to create SVG icon for Cluster Marker
const createClusterIcon = (count: number, color: string) => {
    const baseSize = 40;
    const size = Math.min(60, baseSize + Math.log2(count + 1) * 6);

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="2"/>
      <text x="50%" y="50%" dy=".3em" font-size="14" font-weight="bold" font-family="Arial" text-anchor="middle" fill="white">${count}</text>
    </svg>
  `;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2)
    };
};

const VizagMapView: React.FC<VizagMapViewProps> = ({ issues, selectedWard, selectedZone }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    const mapOptions: google.maps.MapOptions = useMemo(() => ({
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR || 1,
            position: window.google?.maps?.ControlPosition?.TOP_CENTER || 2,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
        },
        streetViewControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_TOP || 2
        },
        zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 8
        },
        minZoom: 3,
        maxZoom: 20,
        clickableIcons: false,
        scrollwheel: false, // Disable scroll wheel zoom
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit.station',
                stylers: [{ visibility: 'off' }]
            }
        ]
    }), []);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zoom, setZoom] = useState(11);
    const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<GeneralIssue | null>(null);
    const [issueOpenedAtZoom, setIssueOpenedAtZoom] = useState<number | null>(null);
    const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);
    const wardDataLayerRef = useRef<google.maps.Data | null>(null);
    const mapInitialized = useRef(false);

    const [isHeatmapMode, setIsHeatmapMode] = useState(false);

    // Initialize map bounds
    useEffect(() => {
        if (map && issues.length > 0 && !mapInitialized.current) {
            const bounds = new google.maps.LatLngBounds();
            issues.forEach(issue => {
                if (issue.lat && issue.lng) {
                    bounds.extend({ lat: issue.lat, lng: issue.lng });
                }
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 420 });
                mapInitialized.current = true;
            }
        }
    }, [map, issues]);

    // Load ward boundaries
    useEffect(() => {
        if (!map || !window.google) return;

        // Initialize ward data layer if needed
        if (!wardDataLayerRef.current) {
            wardDataLayerRef.current = new google.maps.Data();
            wardDataLayerRef.current.setMap(map);
        }

        const wardLayer = wardDataLayerRef.current;

        // Load GeoJSON
        fetch('/vishakhapatnam_wards.geojson')
            .then(response => response.json())
            .then(geojson => {
                wardLayer.addGeoJson(geojson);

                // Style ward boundaries
                wardLayer.setStyle((feature) => {
                    const wardNum = feature.getProperty('sourcewardcode');
                    const isSelected = selectedWard && wardNum === selectedWard;

                    return {
                        fillColor: isSelected ? '#3B82F6' : '#10B981',
                        fillOpacity: isSelected ? 0.2 : 0.05,
                        strokeColor: isSelected ? '#1D4ED8' : '#059669',
                        strokeWeight: isSelected ? 3 : 1,
                        strokeOpacity: isSelected ? 0.8 : 0.3
                    };
                });
            })
            .catch(error => console.error('Error loading ward boundaries:', error));

        return () => {
            if (wardLayer) {
                wardLayer.forEach((feature) => wardLayer.remove(feature));
            }
        };
    }, [map, selectedWard]);

    // Heatmap data
    const heatmapData = useMemo(() => {
        if (!isLoaded || !isHeatmapMode || !window.google || !issues) return [];

        return issues
            .filter(i => i.lat !== null && i.lng !== null)
            .map(issue => ({
                location: new google.maps.LatLng(issue.lat!, issue.lng!),
                weight: 1
            }));
    }, [isLoaded, issues, isHeatmapMode]);

    const heatmapOptions = useMemo(() => ({
        radius: 30,
        opacity: 0.6,
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
    }), []);

    // Clustering
    const supercluster = useMemo(() => {
        const cluster = new Supercluster({
            radius: 60,
            maxZoom: 18,
            minZoom: 0,
            minPoints: 2,
            map: (props: any) => {
                const issueType = props.issue.primaryIssue || 'unknown';
                return {
                    issueTypeCounts: { [issueType]: 1 }
                };
            },
            reduce: (accumulated: any, props: any) => {
                for (const type in props.issueTypeCounts) {
                    accumulated.issueTypeCounts[type] = (accumulated.issueTypeCounts[type] || 0) + props.issueTypeCounts[type];
                }
            }
        });

        const points = issues
            .filter(issue => issue.lat !== null && issue.lng !== null)
            .map((issue) => ({
                type: 'Feature' as const,
                properties: {
                    cluster: false,
                    issue
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [issue.lng!, issue.lat!]
                }
            }));

        cluster.load(points);
        return cluster;
    }, [issues]);

    const clusters = useMemo(() => {
        if (!bounds) return [];

        const bbox: [number, number, number, number] = [
            bounds.getSouthWest().lng(),
            bounds.getSouthWest().lat(),
            bounds.getNorthEast().lng(),
            bounds.getNorthEast().lat()
        ];

        const rawClusters = supercluster.getClusters(bbox, Math.floor(zoom));

        return rawClusters.map((cluster) => {
            if (cluster.properties.cluster) {
                const issueTypeCounts = cluster.properties.issueTypeCounts as Record<string, number>;
                let dominantType = 'unknown';
                let maxCount = 0;
                if (issueTypeCounts) {
                    Object.entries(issueTypeCounts).forEach(([type, count]) => {
                        if (count > maxCount) {
                            maxCount = count;
                            dominantType = type;
                        }
                    });
                }
                return {
                    ...cluster,
                    properties: {
                        ...cluster.properties,
                        dominantIssueType: dominantType
                    }
                };
            }
            return cluster;
        });
    }, [bounds, zoom, supercluster]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        setBounds(map.getBounds() || null);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const onBoundsChanged = useCallback(() => {
        if (!map) return;
        if (boundsChangeTimeout.current) {
            clearTimeout(boundsChangeTimeout.current);
        }
        boundsChangeTimeout.current = setTimeout(() => {
            const newZoom = map.getZoom() || 12;
            setBounds(map.getBounds() || null);
            if (selectedIssue && issueOpenedAtZoom !== null && newZoom < issueOpenedAtZoom) {
                setSelectedIssue(null);
                setIssueOpenedAtZoom(null);
            }
            setZoom(newZoom);
        }, 200);
    }, [map, selectedIssue, issueOpenedAtZoom]);

    const handleClusterClick = useCallback((clusterId: number, clusterLat: number, clusterLng: number) => {
        if (!map) return;
        setSelectedIssue(null);
        setIssueOpenedAtZoom(null);
        const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 20);
        map.setZoom(expansionZoom);
        map.panTo({ lat: clusterLat, lng: clusterLng });
    }, [map, supercluster]);

    const handleMarkerClick = useCallback((issue: GeneralIssue) => {
        setSelectedIssue(issue);
        setIssueOpenedAtZoom(map?.getZoom() || zoom);
        if (map) {
            const scale = Math.pow(2, map.getZoom() || 12);
            const offsetY = 350 / scale;
            const projection = map.getProjection();
            if (projection) {
                const point = projection.fromLatLngToPoint(new google.maps.LatLng(issue.lat!, issue.lng!));
                if (point) {
                    const newPoint = new google.maps.Point(point.x, point.y - offsetY);
                    const newLatLng = projection.fromPointToLatLng(newPoint);
                    if (newLatLng) {
                        map.panTo(newLatLng);
                        return;
                    }
                }
            }
            map.panTo({ lat: issue.lat!, lng: issue.lng! });
        }
    }, [map, zoom]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div className="absolute top-[10px] right-[10px] z-[5] flex items-center bg-white rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.3)] h-10 cursor-pointer transition-colors user-select-none">
                <button
                    onClick={() => setIsHeatmapMode(!isHeatmapMode)}
                    className={`px-4 h-full text-sm font-medium ${isHeatmapMode ? 'text-blue-600 hover:bg-gray-50' : 'text-gray-600 hover:text-black hover:bg-gray-50'}`}
                >
                    {isHeatmapMode ? 'Show Clusters' : 'Show Heatmap'}
                </button>
            </div>

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={vizagCenter}
                zoom={11}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onBoundsChanged={onBoundsChanged}
                options={mapOptions}
            >
                <HeatmapLayer
                    data={isHeatmapMode ? heatmapData : []}
                    options={heatmapOptions}
                />

                {!isHeatmapMode && clusters.map((cluster) => {
                    const [lng, lat] = cluster.geometry.coordinates;
                    const { cluster: isCluster, point_count, cluster_id, dominantIssueType } = cluster.properties;

                    if (isCluster) {
                        const count = point_count || 0;
                        const color = getPriorityColor(dominantIssueType as any);

                        return (
                            <Marker
                                key={`cluster-${cluster_id}`}
                                position={{ lat, lng }}
                                icon={createClusterIcon(count, color)}
                                onClick={() => handleClusterClick(cluster_id!, lat, lng)}
                                zIndex={100}
                            />
                        );
                    }

                    const issue = cluster.properties.issue;
                    const color = getPriorityColor(issue.primaryIssue as any);
                    const charLabel = issue.primaryIssue?.charAt(0).toUpperCase() || '?';

                    return (
                        <Marker
                            key={`issue-${issue.id}`}
                            position={{ lat, lng }}
                            icon={createIssueIcon(color, charLabel)}
                            onClick={() => handleMarkerClick(issue)}
                        />
                    );
                })}

                {!isHeatmapMode && selectedIssue && (
                    <OverlayView
                        position={{ lat: selectedIssue.lat!, lng: selectedIssue.lng! }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div
                            className="relative pointer-events-auto"
                            style={{
                                transform: 'translate(-50%, -100%)',
                                marginTop: '-40px',
                                zIndex: 1000
                            }}
                        >
                            <div className="w-80 max-w-[90vw]">
                                <GeneralIssueCard
                                    issue={selectedIssue}
                                    onClose={() => {
                                        setSelectedIssue(null);
                                        setIssueOpenedAtZoom(null);
                                    }}
                                    isExpanded={true}
                                />
                            </div>
                            <div
                                className="absolute left-1/2 -bottom-2 w-0 h-0"
                                style={{
                                    borderLeft: '12px solid transparent',
                                    borderRight: '12px solid transparent',
                                    borderTop: '12px solid white',
                                    transform: 'translateX(-50%)',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                }}
                            />
                        </div>
                    </OverlayView>
                )}
            </GoogleMap>
        </div>
    );
};

export default VizagMapView;
