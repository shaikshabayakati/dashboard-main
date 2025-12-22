'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, HeatmapLayer, Marker } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { PotholeReport } from '@/types/PotholeReport';
import { useGeographic } from '@/contexts/GeographicContext';
import ReportCard from './ReportCard';
import ClusterListView from './ClusterListView';
import { getSeverityColor } from '@/utils/helpers';

interface MapViewProps {
  reports: PotholeReport[];
  filters?: { district: string | null; mandal: string | null };
  selectedDistrict?: string | null;
  selectedMandal?: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Define libraries as a static constant to prevent infinite loops in useJsApiLoader
const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ['visualization'];

const defaultCenter = {
  lat: 15.9129,
  lng: 79.7400
};

// Helper to create SVG icon for Pothole Marker
const createPotholeIcon = (color: string, label: string) => {
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

const MapView: React.FC<MapViewProps> = ({ reports, filters, selectedDistrict, selectedMandal }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const {
    setHighlightedDistrict,
    setHighlightedMandal,
    getDistrictBoundary,
    getMandalBoundary,
    getMandalCenter
  } = useGeographic();

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
    // Disable POIs, transit, and business labels for faster loading
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
  const [zoom, setZoom] = useState(7);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null);
  const [clusterReports, setClusterReports] = useState<PotholeReport[] | null>(null);
  const [reportOpenedAtZoom, setReportOpenedAtZoom] = useState<number | null>(null);
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refs for Data Layers (replacing state)
  const districtDataLayerRef = useRef<google.maps.Data | null>(null);
  const mandalDataLayerRef = useRef<google.maps.Data | null>(null);

  const [isHeatmapMode, setIsHeatmapMode] = useState(false);

  // Lazy-load Heatmap Data
  const heatmapData = useMemo(() => {
    if (!isLoaded || !isHeatmapMode || !window.google || !reports) return [];

    return reports
      .filter(r => r.lat && r.lng)
      .map(report => ({
        location: new google.maps.LatLng(report.lat, report.lng),
        weight: 1
      }));
  }, [isLoaded, reports, isHeatmapMode]);

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

  const lastAppliedDistrict = useRef<string | null>(null);
  const lastAppliedMandal = useRef<string | null>(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (map && reports.length > 0 && !mapInitialized.current) {
      const bounds = new google.maps.LatLngBounds();
      reports.forEach(report => {
        bounds.extend({ lat: report.lat, lng: report.lng });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 420 });
        mapInitialized.current = true;
      }
    }
  }, [map, reports]);

  // Optimized Highlight Effect: Reuse Data Layers
  useEffect(() => {
    if (!map || !window.google) return;

    const districtChanged = selectedDistrict !== lastAppliedDistrict.current;
    const mandalChanged = selectedMandal !== lastAppliedMandal.current;

    if (!districtChanged && !mandalChanged) return;

    lastAppliedDistrict.current = selectedDistrict || null;
    lastAppliedMandal.current = selectedMandal || null;

    setHighlightedDistrict(null);
    setHighlightedMandal(null);

    // Initialize layers if needed
    if (!districtDataLayerRef.current) {
      districtDataLayerRef.current = new google.maps.Data();
      districtDataLayerRef.current.setMap(map);
    }
    if (!mandalDataLayerRef.current) {
      mandalDataLayerRef.current = new google.maps.Data();
      mandalDataLayerRef.current.setMap(map);
    }

    const dLayer = districtDataLayerRef.current;
    const mLayer = mandalDataLayerRef.current;

    // Clear existing features
    dLayer.forEach((feature) => dLayer.remove(feature));
    mLayer.forEach((feature) => mLayer.remove(feature));

    if (selectedMandal) {
      setHighlightedMandal(selectedMandal);
      const mandalBoundary = getMandalBoundary(selectedMandal);
      const mandalCenter = getMandalCenter(selectedMandal);

      if (mandalBoundary) {
        try {
          mLayer.addGeoJson(mandalBoundary);
          mLayer.setStyle({
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            strokeColor: '#1D4ED8',
            strokeWeight: 3,
            strokeOpacity: 0.8
          });
        } catch (error) {
          console.error('Error adding mandal boundary:', error);
        }
      }

      if (mandalCenter && typeof mandalCenter.lat === 'number' && typeof mandalCenter.lng === 'number' && !isNaN(mandalCenter.lat) && !isNaN(mandalCenter.lng)) {
        map.setCenter(mandalCenter);
        map.setZoom(12);
      }

      if (selectedDistrict) {
        setHighlightedDistrict(selectedDistrict);
        const districtBoundary = getDistrictBoundary(selectedDistrict);
        if (districtBoundary) {
          dLayer.addGeoJson(districtBoundary);
          dLayer.setStyle({
            fillColor: '#10B981',
            fillOpacity: 0.1,
            strokeColor: '#059669',
            strokeWeight: 2,
            strokeOpacity: 0.6
          });
        }
      }
    } else if (selectedDistrict) {
      setHighlightedDistrict(selectedDistrict);
      const districtBoundary = getDistrictBoundary(selectedDistrict);

      if (districtBoundary) {
        try {
          dLayer.addGeoJson(districtBoundary);
          dLayer.setStyle({
            fillColor: '#10B981',
            fillOpacity: 0.2,
            strokeColor: '#059669',
            strokeWeight: 3,
            strokeOpacity: 0.8
          });

          // Fit bounds logic - strictly on change
          const bounds = new google.maps.LatLngBounds();
          districtBoundary.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
              let allCoordinates: [number, number][] = [];
              if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach((polygon: any) => {
                  if (polygon[0] && Array.isArray(polygon[0])) {
                    allCoordinates.push(...polygon[0]);
                  }
                });
              } else if (feature.geometry.type === 'Polygon') {
                if (feature.geometry.coordinates[0] && Array.isArray(feature.geometry.coordinates[0])) {
                  allCoordinates = feature.geometry.coordinates[0];
                }
              }
              allCoordinates.forEach((coord: [number, number]) => {
                if (typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                  !isNaN(coord[0]) && !isNaN(coord[1])) {
                  bounds.extend({ lat: coord[1], lng: coord[0] });
                }
              });
            }
          });
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 370 });
          }
        } catch (error) {
          console.error('Error adding district boundary:', error);
        }
      }
    }
  }, [map, selectedDistrict, selectedMandal, getDistrictBoundary, getMandalBoundary, getMandalCenter, setHighlightedDistrict, setHighlightedMandal]);

  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 18,
      minZoom: 0,
      minPoints: 2,
      map: (props: any) => {
        const severity = props.report.severityLabel || 'unknown';
        return {
          severityCounts: { [severity]: 1 }
        };
      },
      reduce: (accumulated: any, props: any) => {
        for (const severity in props.severityCounts) {
          accumulated.severityCounts[severity] = (accumulated.severityCounts[severity] || 0) + props.severityCounts[severity];
        }
      }
    });

    const points = reports.map((report) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        report
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [report.lng, report.lat]
      }
    }));

    cluster.load(points);
    return cluster;
  }, [reports]);

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
        const severityCounts = cluster.properties.severityCounts as Record<string, number>;
        let dominantLabel = 'unknown';
        let maxCount = 0;
        if (severityCounts) {
          Object.entries(severityCounts).forEach(([label, count]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantLabel = label;
            }
          });
        }
        return {
          ...cluster,
          properties: {
            ...cluster.properties,
            dominantSeverityLabel: dominantLabel
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
      if (selectedReport && reportOpenedAtZoom !== null && newZoom < reportOpenedAtZoom) {
        setSelectedReport(null);
        setReportOpenedAtZoom(null);
      }
      setZoom(newZoom);
    }, 200);
  }, [map, selectedReport, reportOpenedAtZoom, zoom]);

  const handleClusterClick = useCallback((clusterId: number, clusterLat: number, clusterLng: number) => {
    if (!map) return;
    setSelectedReport(null);
    setReportOpenedAtZoom(null);
    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 20);
    map.setZoom(expansionZoom);
    map.panTo({ lat: clusterLat, lng: clusterLng });
  }, [map, supercluster]);

  const handleMarkerClick = useCallback((report: PotholeReport) => {
    setClusterReports(null);
    setSelectedReport(report);
    setReportOpenedAtZoom(map?.getZoom() || zoom);
    if (map) {
      const scale = Math.pow(2, map.getZoom() || 12);
      const offsetY = 350 / scale;
      const projection = map.getProjection();
      if (projection) {
        const point = projection.fromLatLngToPoint(new google.maps.LatLng(report.lat, report.lng));
        if (point) {
          const newPoint = new google.maps.Point(point.x, point.y - offsetY);
          const newLatLng = projection.fromPointToLatLng(newPoint);
          if (newLatLng) {
            map.panTo(newLatLng);
            return;
          }
        }
      }
      map.panTo({ lat: report.lat, lng: report.lng });
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
          {isHeatmapMode ? 'Show Clusters' : 'Show Heatmaps'}
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={7}
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
          const { cluster: isCluster, point_count, cluster_id, dominantSeverityLabel } = cluster.properties;

          if (isCluster) {
            const count = point_count || 0;
            const label = dominantSeverityLabel || 'unknown';
            const color = getSeverityColor(label);

            return (
              <Marker
                key={`cluster-${cluster_id}`}
                position={{ lat, lng }}
                icon={createClusterIcon(count, color)}
                onClick={() => handleClusterClick(cluster_id!, lat, lng)}
                zIndex={100}
                label={{
                  text: count.toString(),
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              />
            );
          }

          const report = cluster.properties.report;
          const severityLabel = report.severityLabel || 'unknown';
          const color = getSeverityColor(severityLabel);
          const charLabel = severityLabel.charAt(0).toUpperCase();

          return (
            <Marker
              key={`report-${report.id}`}
              position={{ lat, lng }}
              icon={createPotholeIcon(color, charLabel)}
              onClick={() => handleMarkerClick(report)}
            />
          );
        })}

        {!isHeatmapMode && selectedReport && (
          <OverlayView
            position={{ lat: selectedReport.lat, lng: selectedReport.lng }}
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
                <ReportCard
                  report={selectedReport}
                  onClose={() => {
                    setSelectedReport(null);
                    setReportOpenedAtZoom(null);
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

      {!isHeatmapMode && clusterReports && (
        <ClusterListView
          reports={clusterReports}
          onClose={() => setClusterReports(null)}
        />
      )}
    </div>
  );
};

export default MapView;
