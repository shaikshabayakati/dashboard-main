import { DatabasePotholeReport, PotholeReport } from '@/types/PotholeReport';

/**
 * Maps database schema to frontend schema
 * This utility makes it easy to adapt when the database schema changes
 *
 * To update mapping when DB schema changes:
 * 1. Update DatabasePotholeReport interface in types/PotholeReport.ts
 * 2. Update this mapDatabaseToFrontend function to map new fields
 */
export function mapDatabaseToFrontend(dbReport: DatabasePotholeReport): PotholeReport {
  // Use severity_score (numeric) from database - this is the ML model's output
  const severityValue = dbReport.severity_score ?? dbReport.confidence ?? 0.5;

  // Use the 'severity' column from database (contains 'low', 'medium', 'high')
  const severityLabel = mapSeverityLabel(dbReport.severity);

  return {
    id: String(dbReport.id),
    lat: dbReport.latitude,
    lng: dbReport.longitude,
    severity: severityValue,
    severityLabel: severityLabel,
    impactScore: dbReport.impact_score ?? undefined,
    timestamp: dbReport.created_at,
    images: dbReport.image_url ? [dbReport.image_url] : [],
    description: `Pothole detected with ${Math.round((dbReport.confidence ?? 0) * 100)}% confidence`,
    status: mapStatus(dbReport.status),
    reporter_id: dbReport.user_phone,
    reporter_phone: dbReport.user_phone,
    district: dbReport.district || 'Unknown',
    subDistrict: dbReport.mandal || 'Unknown',
    mandal: dbReport.mandal || undefined,
    location: `${dbReport.latitude.toFixed(6)}, ${dbReport.longitude.toFixed(6)}`,
    address: dbReport.address,
    roadName: dbReport.road_name,
    roadType: dbReport.road_type,
    roadOwnership: dbReport.road_ownership,
    roadAuthority: dbReport.road_authority,
    roadClassification: dbReport.road_classification,
    roadNameFromGeoJson: dbReport.road_name_from_geojson,
    roadTypeFromGeoJson: dbReport.road_type_from_geojson,
    detectionCount: dbReport.detection_count,
  };
}

/**
 * Maps database severity_label to frontend severity label type
 */
function mapSeverityLabel(dbLabel: string | null): 'low' | 'medium' | 'high' | 'unknown' {
  if (!dbLabel) return 'unknown';
  const normalized = dbLabel.toLowerCase().trim();
  if (normalized === 'low') return 'low';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'high') return 'high';
  return 'unknown';
}

/**
 * Maps database status strings to frontend status types
 * Add new status mappings here when the database schema changes
 */
function mapStatus(dbStatus: string): 'new' | 'triaged' | 'assigned' | 'fixed' {
  const statusMap: Record<string, 'new' | 'triaged' | 'assigned' | 'fixed'> = {
    'new': 'new',
    'pending': 'triaged',
    'triaged': 'triaged',
    'in_progress': 'assigned',
    'assigned': 'assigned',
    'resolved': 'fixed',
    'fixed': 'fixed',
    'completed': 'fixed',
  };

  return statusMap[dbStatus.toLowerCase()] ?? 'new';
}

/**
 * Batch map multiple database reports to frontend format
 */
export function mapDatabaseReportsToFrontend(dbReports: DatabasePotholeReport[]): PotholeReport[] {
  return dbReports
    .filter(report => report.is_pothole) // Only include confirmed potholes
    .filter(report => report.detection_count > 0) // Only include reports with detections
    .map(mapDatabaseToFrontend);
}
