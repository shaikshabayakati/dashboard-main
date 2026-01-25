import { useState, useEffect } from 'react';
import { DatabasePotholeReport, PotholeReport } from '@/types/PotholeReport';
import { mapDatabaseReportsToFrontend } from '@/utils/reportMapper';

interface UsePotholeReportsParams {
  district?: string | null;
  mandal?: string | null;
  wardNumber?: number | null;
}

interface UsePotholeReportsReturn {
  reports: PotholeReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePotholeReports(params?: UsePotholeReportsParams): UsePotholeReportsReturn {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string from filter parameters
      const queryParams = new URLSearchParams();
      if (params?.district) {
        queryParams.append('district', params.district);
      }
      if (params?.mandal) {
        queryParams.append('mandal', params.mandal);
      }
      if (params?.wardNumber !== null && params?.wardNumber !== undefined) {
        queryParams.append('wardNumber', params.wardNumber.toString());
      }

      const queryString = queryParams.toString();
      const url = `/api/reports${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      // API returns array directly, not wrapped in {reports: [...]}
      const dbReports: DatabasePotholeReport[] = await response.json();

      // Map database schema to frontend schema
      const mappedReports = mapDatabaseReportsToFrontend(dbReports);

      setReports(mappedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching pothole reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [params?.district, params?.mandal, params?.wardNumber]);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports
  };
}
