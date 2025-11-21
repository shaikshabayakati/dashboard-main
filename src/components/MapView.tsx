'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { PotholeReport } from '@/types/PotholeReport';
import { District, defaultStateCenter } from '@/data/districts';
import ClusterMarker from './ClusterMarker';
import PotholeMarker from './PotholeMarker';
import ReportCard from './ReportCard';
import ClusterListView from './ClusterListView';

interface MapViewProps {
  reports: PotholeReport[];
  selectedDistrict?: District | null;
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

const MapView: React.FC<MapViewProps> = ({ reports, selectedDistrict }) => {
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
    restriction: {
      latLngBounds: andhraPradesh_Bounds,
      strictBounds: false
    },
    minZoom: 7,
    maxZoom: 20
  }), []);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(defaultStateCenter.zoom || 7);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null);
  const [clusterReports, setClusterReports] = useState<PotholeReport[] | null>(null);

  // Handle district selection - center map on selected district
  useEffect(() => {
    if (map && selectedDistrict) {
      map.panTo({ lat: selectedDistrict.lat, lng: selectedDistrict.lng });
      if (selectedDistrict.zoom) {
        map.setZoom(selectedDistrict.zoom);
      }
    }
  }, [map, selectedDistrict]);

  // Initialize Supercluster
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 20,
      minZoom: 0
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

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    if (!bounds) return [];

    const bbox: [number, number, number, number] = [
      bounds.getSouthWest().lng(),
      bounds.getSouthWest().lat(),
      bounds.getNorthEast().lng(),
      bounds.getNorthEast().lat()
    ];

    return supercluster.getClusters(bbox, Math.floor(zoom));
  }, [bounds, zoom, supercluster]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setBounds(map.getBounds() || null);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onBoundsChanged = useCallback(() => {
    if (map) {
      setBounds(map.getBounds() || null);
      setZoom(map.getZoom() || 12);
    }
  }, [map]);

  const handleClusterClick = useCallback((clusterId: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(clusterId);
    const cluster = clusters.find(
      (c) => c.properties.cluster && c.properties.cluster_id === clusterId
    );

    if (!cluster) return;

    const [lng, lat] = cluster.geometry.coordinates;

    if (expansionZoom >= 20) {
      // Max zoom reached, show list of reports
      const leaves = supercluster.getLeaves(clusterId, Infinity);
      const reportsInCluster = leaves.map((leaf: any) => leaf.properties.report);
      setClusterReports(reportsInCluster);
    } else {
      // Zoom into cluster
      map?.panTo({ lat, lng });
      map?.setZoom(expansionZoom);
    }
  }, [clusters, map, supercluster]);

  const handleMarkerClick = useCallback((report: PotholeReport) => {
    setSelectedReport(report);
    map?.panTo({ lat: report.lat, lng: report.lng });
  }, [map]);

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
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

          if (isCluster) {
            // Calculate average severity for cluster
            const leaves = supercluster.getLeaves(cluster_id!, Infinity);
            const avgSeverity =
              leaves.reduce((sum: number, leaf: any) => sum + leaf.properties.report.severity, 0) /
              leaves.length;

            return (
              <OverlayView
                key={`cluster-${cluster_id}`}
                position={{ lat, lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <ClusterMarker
                  count={point_count!}
                  avgSeverity={avgSeverity}
                  onClick={() => handleClusterClick(cluster_id!)}
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
                severity={report.severity}
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
                  onClose={() => setSelectedReport(null)}
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
    </div>
  );
};

export default MapView;
