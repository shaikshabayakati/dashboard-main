import { useState, useEffect } from 'react';
import { DatabasePotholeReport, PotholeReport } from '@/types/PotholeReport';
import { mapDatabaseReportsToFrontend } from '@/utils/reportMapper';

interface UsePotholeReportsReturn {
  reports: PotholeReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePotholeReports(): UsePotholeReportsReturn {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reports');

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
  }, []);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports
  };
}
