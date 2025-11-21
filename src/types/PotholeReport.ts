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


