'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, HeatmapLayer } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { PotholeReport } from '@/types/PotholeReport';
import { useGeographic } from '@/contexts/GeographicContext';
import ClusterMarker from './ClusterMarker';
import PotholeMarker from './PotholeMarker';
import ReportCard from './ReportCard';
import ClusterListView from './ClusterListView';

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
    clickableIcons: false  // Disable clicking on POI icons (places, businesses, etc.)
  }), []);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(7);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null);
  const [clusterReports, setClusterReports] = useState<PotholeReport[] | null>(null);
  const [reportOpenedAtZoom, setReportOpenedAtZoom] = useState<number | null>(null);
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [districtDataLayer, setDistrictDataLayer] = useState<google.maps.Data | null>(null);
  const [mandalDataLayer, setMandalDataLayer] = useState<google.maps.Data | null>(null);

  // Generate Heatmap Data
  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google || !reports) return [];

    return reports
      .filter(r => r.lat && r.lng) // Ensure valid coordinates
      .map(report => ({
        location: new google.maps.LatLng(report.lat, report.lng),
        weight: 1 // Use constant weight to visualize density (number of reports)
      }));
  }, [isLoaded, reports]);

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

  const [isHeatmapMode, setIsHeatmapMode] = useState(false);

  // Auto-fit map to show all filtered reports when filters change
  useEffect(() => {
    if (map && reports.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      reports.forEach(report => {
        bounds.extend({ lat: report.lat, lng: report.lng });
      });

      // Only fit bounds if we have a valid bounds object
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 420 }); // Add padding, extra on left for sidebar
      }
    }
  }, [map, filters]);

  // Handle district and mandal highlighting and scrolling
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing highlighting
    setHighlightedDistrict(null);
    setHighlightedMandal(null);

    // Clear existing data layers
    if (districtDataLayer) {
      districtDataLayer.setMap(null);
      setDistrictDataLayer(null);
    }
    if (mandalDataLayer) {
      mandalDataLayer.setMap(null);
      setMandalDataLayer(null);
    }

    // Handle mandal selection (has priority over district)
    if (selectedMandal) {
      setHighlightedMandal(selectedMandal);

      // Get mandal boundary and center
      const mandalBoundary = getMandalBoundary(selectedMandal);
      const mandalCenter = getMandalCenter(selectedMandal);

      if (mandalBoundary) {
        try {
          // Create data layer for mandal
          const dataLayer = new google.maps.Data();
          dataLayer.addGeoJson(mandalBoundary);
          dataLayer.setStyle({
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            strokeColor: '#1D4ED8',
            strokeWeight: 3,
            strokeOpacity: 0.8
          });
          dataLayer.setMap(map);
          setMandalDataLayer(dataLayer);
        } catch (error) {
          console.error('Error creating mandal data layer:', error, mandalBoundary);
        }
      }

      if (mandalCenter && typeof mandalCenter.lat === 'number' && typeof mandalCenter.lng === 'number' && !isNaN(mandalCenter.lat) && !isNaN(mandalCenter.lng)) {
        // Scroll to mandal center only if coordinates are valid
        map.setCenter(mandalCenter);
        map.setZoom(12);
      } else {
        console.error('Invalid mandal center coordinates for:', selectedMandal, mandalCenter);
      }

      // Also highlight the containing district
      if (selectedDistrict) {
        setHighlightedDistrict(selectedDistrict);
        const districtBoundary = getDistrictBoundary(selectedDistrict);
        if (districtBoundary) {
          const districtLayer = new google.maps.Data();
          districtLayer.addGeoJson(districtBoundary);
          districtLayer.setStyle({
            fillColor: '#10B981',
            fillOpacity: 0.1,
            strokeColor: '#059669',
            strokeWeight: 2,
            strokeOpacity: 0.6
          });
          districtLayer.setMap(map);
          setDistrictDataLayer(districtLayer);
        }
      }
    } else if (selectedDistrict) {
      // Handle district-only selection
      setHighlightedDistrict(selectedDistrict);

      const districtBoundary = getDistrictBoundary(selectedDistrict);
      if (districtBoundary) {
        try {
          // Create data layer for district
          const dataLayer = new google.maps.Data();
          dataLayer.addGeoJson(districtBoundary);
          dataLayer.setStyle({
            fillColor: '#10B981',
            fillOpacity: 0.2,
            strokeColor: '#059669',
            strokeWeight: 3,
            strokeOpacity: 0.8
          });
          dataLayer.setMap(map);
          setDistrictDataLayer(dataLayer);

          // Fit map to district bounds
          const bounds = new google.maps.LatLngBounds();
          districtBoundary.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
              let allCoordinates: [number, number][] = [];

              // Handle both Polygon and MultiPolygon geometries
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
          console.error('Error creating district data layer:', error, districtBoundary);
        }
      }
    }

    // Cleanup function
    return () => {
      if (districtDataLayer) {
        districtDataLayer.setMap(null);
      }
      if (mandalDataLayer) {
        mandalDataLayer.setMap(null);
      }
    };
  }, [map, selectedDistrict, selectedMandal, getDistrictBoundary, getMandalBoundary, getMandalCenter, setHighlightedDistrict, setHighlightedMandal]);

  // Initialize Supercluster - now using pre-filtered reports from Dashboard
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,      // Pixel radius for clustering - larger for better grouping
      maxZoom: 18,     // Stop clustering at zoom 18, show individual markers beyond this
      minZoom: 0,      // Start clustering from zoom 0
      minPoints: 2,    // Minimum 2 points to form a cluster
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

  // Get clusters for current viewport with pre-computed dominant labels
  const clusters = useMemo(() => {
    if (!bounds) return [];

    const bbox: [number, number, number, number] = [
      bounds.getSouthWest().lng(),
      bounds.getSouthWest().lat(),
      bounds.getNorthEast().lng(),
      bounds.getNorthEast().lat()
    ];

    const rawClusters = supercluster.getClusters(bbox, Math.floor(zoom));

    // Pre-compute dominant severity labels for all clusters at once
    return rawClusters.map((cluster) => {
      if (cluster.properties.cluster) {
        const leaves = supercluster.getLeaves(cluster.properties.cluster_id!, Infinity);
        const labelCounts: Record<string, number> = {};
        leaves.forEach((leaf: any) => {
          const label = leaf.properties.report.severityLabel || 'unknown';
          labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
        const dominantLabel = Object.entries(labelCounts).reduce(
          (max, [label, count]) => (count > max.count ? { label, count } : max),
          { label: 'unknown', count: 0 }
        ).label;

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

    // Throttle bounds updates to improve performance during panning/zooming
    if (boundsChangeTimeout.current) {
      clearTimeout(boundsChangeTimeout.current);
    }

    boundsChangeTimeout.current = setTimeout(() => {
      const newZoom = map.getZoom() || 12;
      setBounds(map.getBounds() || null);

      // Auto-close report card when zooming out
      if (selectedReport && reportOpenedAtZoom !== null && newZoom < reportOpenedAtZoom) {
        setSelectedReport(null);
        setReportOpenedAtZoom(null);
      }

      setZoom(newZoom);
    }, 100); // 100ms throttle
  }, [map, selectedReport, reportOpenedAtZoom, zoom]);

  const handleClusterClick = useCallback((clusterId: number, clusterLat: number, clusterLng: number) => {
    if (!map) return;

    // Close any open single report when clicking a cluster
    setSelectedReport(null);
    setReportOpenedAtZoom(null);

    // Get the zoom level Supercluster recommends for this cluster
    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 20);

    // Zoom to the expansion zoom level and center on cluster
    map.setZoom(expansionZoom);
    map.panTo({ lat: clusterLat, lng: clusterLng });
  }, [map, supercluster]);

  const handleMarkerClick = useCallback((report: PotholeReport) => {
    // Close cluster list when clicking a single marker
    setClusterReports(null);
    setSelectedReport(report);
    // Track the zoom level when report was opened (for auto-close on zoom out)
    setReportOpenedAtZoom(map?.getZoom() || zoom);

    // Pan to marker but offset downward so the popup card is fully visible
    // This places the marker in the lower portion of the screen
    if (map) {
      const mapDiv = map.getDiv();
      const mapHeight = mapDiv.offsetHeight;
      // Calculate offset: move the center point down by ~30% of map height
      // so the marker appears in the lower third, leaving room for the card above
      const projection = map.getProjection();
      if (projection) {
        const point = projection.fromLatLngToPoint(new google.maps.LatLng(report.lat, report.lng));
        if (point) {
          const scale = Math.pow(2, map.getZoom() || 12);
          // Offset by ~200 pixels worth of latitude (card height + margin)
          const offsetY = 200 / scale;
          const newPoint = new google.maps.Point(point.x, point.y - offsetY);
          const newLatLng = projection.fromPointToLatLng(newPoint);
          if (newLatLng) {
            map.panTo(newLatLng);
            return;
          }
        }
      }
      // Fallback: just pan to the marker
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
      {/* Custom Heatmap Toggle Button - Standard Google Maps Control styling */}
      <div className="absolute top-[10px] right-[60px] z-[5] flex items-center bg-white rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.3)] h-10 cursor-pointer transition-colors user-select-none">
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
        {/* Heatmap Layer - Always render but clear data when hidden to ensure cleanup */}
        <HeatmapLayer
          data={isHeatmapMode ? heatmapData : []}
          options={heatmapOptions}
        />

        {/* Clusters and Markers - Only visible in Normal Mode */}
        {!isHeatmapMode && clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count, cluster_id, dominantSeverityLabel } = cluster.properties;

          if (isCluster) {
            return (
              <OverlayView
                key={`cluster-${cluster_id}`}
                position={{ lat, lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <ClusterMarker
                  count={point_count!}
                  dominantSeverityLabel={dominantSeverityLabel || 'unknown'}
                  onClick={() => handleClusterClick(cluster_id!, lat, lng)}
                />
              </OverlayView>
            );
          }

          const report = cluster.properties.report;
          return (
            <OverlayView
              key={`report-${report.id}`}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <PotholeMarker
                severityLabel={report.severityLabel}
                onClick={() => handleMarkerClick(report)}
              />
            </OverlayView>
          );
        })}

        {/* Selected Report Card - Only visible in Normal Mode */}
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
              {/* Arrow pointing to marker */}
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

      {/* Cluster List View - Only visible in Normal Mode */}
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
