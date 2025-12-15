// Backend database schema - this is the raw data from the API
export interface DatabasePotholeReport {
  id: number;
  user_phone: string;
  image_url: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  confidence: number;
  is_pothole: boolean;
  severity: string | null;
  impact_score: number | null;
  status: string;
  created_at: string;
  address: string | null;
  road_name: string | null;
  road_type: string | null;
  road_ownership: string | null;
  road_authority: string | null;
  road_classification: string | null;
  road_name_from_geojson: string | null;
  road_type_from_geojson: string | null;
  distance_to_road: number | null;
  detections: {
    boxes: Array<{
      xmax: number;
      xmin: number;
      ymax: number;
      ymin: number;
      confidence: number;
      severity_label: string;
      severity_score: number;
    }>;
    count: number;
  } | null;
  detection_count: number;
  report_id: number | null;
  timestamp: string | null;
  severity_label: string | null;
  severity_score: number | null;
  district: string | null;
  mandal: string | null;
  frontend_id: string | null;
  free_flow_time: number | null;
  typical_time: number | null;
  severity_probabilities: {
    low: number;
    high: number;
    medium: number;
  } | null;
  severity_score_weighted: number | null;
  traffic_score_normalized: number | null;
}

// Frontend display schema - this is what the UI expects
export interface PotholeReport {
  id: string;
  lat: number;
  lng: number;
  severity: number; // 0.0 - 1.0 (severity_score from ML model)
  severityLabel: 'low' | 'medium' | 'high' | 'unknown'; // Direct from ML model
  impactScore?: number; // 0.0 - 1.0 (combined traffic + severity score)
  confidence?: number; // 0.0 - 1.0 (ML model confidence score)
  timestamp: string;
  images: string[];
  description: string;
  status: 'new' | 'triaged' | 'assigned' | 'fixed';
  reporter_id?: string;
  reporter_phone?: string | null;
  district: string | null;
  mandal: string | null;
  subDistrict?: string | null;
  location?: string;
  address?: string | null;
  roadName?: string | null;
  roadType?: string | null;
  roadOwnership?: string | null;
  roadAuthority?: string | null;
  roadClassification?: string | null;
  roadNameFromGeoJson?: string | null;
  roadTypeFromGeoJson?: string | null;
  distanceToRoad?: number | null;
  detectionCount?: number;
}

export interface ClusterPoint {
  type: 'Feature';
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    avgSeverity?: number;
    report?: PotholeReport;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}


