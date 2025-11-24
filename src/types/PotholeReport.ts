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
}

// Frontend display schema - this is what the UI expects
export interface PotholeReport {
  id: string;
  lat: number;
  lng: number;
  severity: number; // 0.0 - 1.0
  timestamp: string;
  images: string[];
  description: string;
  status: 'new' | 'triaged' | 'assigned' | 'fixed';
  reporter_id?: string;
  reporter_phone?: string | null;
  district: string;
  subDistrict: string;
  location?: string;
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


