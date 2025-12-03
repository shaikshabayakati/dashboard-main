'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, Polygon } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { PotholeReport } from '@/types/PotholeReport';
import { District, defaultStateCenter } from '@/data/locationData';
import { getDistrictBoundary, getMandalsByDistrictId, MandalBoundary } from '@/utils/districtBoundaries';
import { filterReportsInAnyBoundary } from '@/utils/geometryUtils';
import ClusterMarker from './ClusterMarker';
import PotholeMarker from './PotholeMarker';
import ReportCard from './ReportCard';
import ClusterListView from './ClusterListView';
import DistrictReportsSidebar from './DistrictReportsSidebar';

interface MapViewProps {
  reports: PotholeReport[];
  selectedDistrict?: District | null;
  selectedMandalId?: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Andhra Pradesh bounds (approximate)
const andhraPradesh_Bounds = {
  north: 19.9, // Northern boundary
  south: 12.6, // Southern boundary
  east: 84.8,  // Eastern boundary
  west: 76.8   // Western boundary
};

const defaultCenter = {
  lat: defaultStateCenter.lat,
  lng: defaultStateCenter.lng
};

const MapView: React.FC<MapViewProps> = ({ reports, selectedDistrict, selectedMandalId }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const mapOptions: google.maps.MapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR || 1,
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 2,
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
  const [zoom, setZoom] = useState(defaultStateCenter.zoom || 7);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null);
  const [clusterReports, setClusterReports] = useState<PotholeReport[] | null>(null);
  const [reportOpenedAtZoom, setReportOpenedAtZoom] = useState<number | null>(null);
  const [districtBoundary, setDistrictBoundary] = useState<any>(null);
  const [mandalBoundaries, setMandalBoundaries] = useState<MandalBoundary[]>([]);
  const [showDistrictSidebar, setShowDistrictSidebar] = useState(false);
  const [selectedMandalBoundary, setSelectedMandalBoundary] = useState<MandalBoundary | null>(null);
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load district boundary and mandals when district is selected
  useEffect(() => {
    async function loadBoundaries() {
      if (!selectedDistrict || selectedDistrict.id === 'andhra-pradesh') {
        setDistrictBoundary(null);
        setMandalBoundaries([]);
        setShowDistrictSidebar(false);
        return;
      }
      
      const boundary = await getDistrictBoundary(selectedDistrict.id);
      const mandals = await getMandalsByDistrictId(selectedDistrict.id);
      setDistrictBoundary(boundary);
      setMandalBoundaries(mandals);
      setShowDistrictSidebar(true);
    }

    loadBoundaries();
  }, [selectedDistrict]);

  // Update selected mandal boundary when mandal is selected and fit map to mandal bounds
  useEffect(() => {
    if (selectedMandalId && mandalBoundaries.length > 0) {
      const mandal = mandalBoundaries.find(m => m.mandalId === selectedMandalId);
      setSelectedMandalBoundary(mandal || null);
      
      // Fit map to mandal bounds when mandal is selected
      if (mandal && map) {
        // Validate bounds before using them
        const { bounds } = mandal;
        if (bounds && 
            typeof bounds.south === 'number' && 
            typeof bounds.north === 'number' && 
            typeof bounds.west === 'number' && 
            typeof bounds.east === 'number' &&
            isFinite(bounds.south) && 
            isFinite(bounds.north) && 
            isFinite(bounds.west) && 
            isFinite(bounds.east) &&
            bounds.south < bounds.north &&
            bounds.west < bounds.east) {
          
          const mapBounds = new google.maps.LatLngBounds(
            { lat: bounds.south, lng: bounds.west },
            { lat: bounds.north, lng: bounds.east }
          );
          map.fitBounds(mapBounds, { top: 50, right: 50, bottom: 50, left: 50 }); // Add padding
        } else {
          console.warn(`Invalid bounds for mandal: ${mandal.mandalId}`, bounds);
        }
      }
    } else {
      setSelectedMandalBoundary(null);
    }
  }, [selectedMandalId, mandalBoundaries, map]);

  // Filter reports within the district or selected mandal
  const districtReports = useMemo(() => {
    if (!districtBoundary || mandalBoundaries.length === 0) {
      return reports; // Show all reports when no district is selected
    }
    
    // If a mandal is selected, filter reports for that mandal only
    if (selectedMandalBoundary) {
      return filterReportsInAnyBoundary(reports, [selectedMandalBoundary.boundary]);
    }
    
    // Otherwise, filter reports that fall within any mandal boundary of the selected district
    const mandalBoundaryCoords = mandalBoundaries.map(mandal => mandal.boundary);
    return filterReportsInAnyBoundary(reports, mandalBoundaryCoords);
  }, [reports, districtBoundary, mandalBoundaries, selectedMandalBoundary]);

  // Handle district selection - center map on selected district using coordinates from locationData.ts
  useEffect(() => {
    if (map && selectedDistrict) {
      // Use the coordinates from locationData.ts (districts.ts)
      map.panTo({ lat: selectedDistrict.lat, lng: selectedDistrict.lng });
      if (selectedDistrict.zoom) {
        map.setZoom(selectedDistrict.zoom);
      }
    }
  }, [map, selectedDistrict]);

  // Initialize Supercluster with settings for proper granular clustering
  // Use districtReports when a district is selected, otherwise use all reports
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,      // Pixel radius for clustering - larger for better grouping
      maxZoom: 18,     // Stop clustering at zoom 18, show individual markers beyond this (adds more levels)
      minZoom: 0,      // Start clustering from zoom 0
      minPoints: 2,    // Minimum 2 points to form a cluster
    });

    // Use filtered reports if district/mandal is selected, otherwise all reports
    const reportsToCluster = (selectedDistrict && selectedDistrict.id !== 'andhra-pradesh') 
      ? districtReports 
      : reports;

    const points = reportsToCluster.map((report) => ({
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
  }, [reports, districtReports, selectedDistrict]);

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
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultStateCenter.zoom || 7}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onBoundsChanged={onBoundsChanged}
        options={mapOptions}
      >
        {/* Mandal Boundaries - Show individual mandals within selected district */}
        {mandalBoundaries.map((mandal) => {
          const isSelected = selectedMandalBoundary?.mandalId === mandal.mandalId;
          
          // Validate and filter out invalid coordinates
          const validCoords = mandal.boundary.filter((coord: any[]) => {
            return Array.isArray(coord) && 
                   coord.length >= 2 && 
                   typeof coord[0] === 'number' && 
                   typeof coord[1] === 'number' &&
                   !isNaN(coord[0]) && 
                   !isNaN(coord[1]) &&
                   isFinite(coord[0]) && 
                   isFinite(coord[1]);
          });

          // Skip rendering if no valid coordinates
          if (validCoords.length < 3) {
            console.warn(`Invalid boundary data for mandal: ${mandal.mandalId}`);
            return null;
          }

          return (
            <Polygon
              key={`mandal-boundary-${mandal.mandalId}`}
              paths={validCoords.map((coord: any[]) => ({ lat: coord[1], lng: coord[0] }))}
              options={{
                fillColor: isSelected ? '#F59E0B' : '#10B981',
                fillOpacity: isSelected ? 0.15 : 0.08,
                strokeColor: isSelected ? '#D97706' : '#059669',
                strokeOpacity: isSelected ? 0.9 : 0.6,
                strokeWeight: isSelected ? 3 : 1.5,
                clickable: false,
                zIndex: isSelected ? 3 : 2
              }}
            />
          );
        })}

        {clusters.map((cluster) => {
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

        {/* Selected Report Card - Popup near marker */}
        {selectedReport && (
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

      {/* Cluster List View */}
      {clusterReports && (
        <ClusterListView
          reports={clusterReports}
          onClose={() => setClusterReports(null)}
        />
      )}

      {/* District Reports Sidebar */}
      {showDistrictSidebar && selectedDistrict && (
        <DistrictReportsSidebar
          districtName={selectedDistrict.name}
          mandalName={selectedMandalBoundary?.mandalName}
          reports={districtReports}
          onClose={() => setShowDistrictSidebar(false)}
        />
      )}
    </div>
  );
};

export default MapView;
