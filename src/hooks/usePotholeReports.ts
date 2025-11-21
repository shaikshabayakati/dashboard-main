import { useState, useEffect } from 'react';
import { PotholeReport } from '@/types/PotholeReport';

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

      const response = await fetch('/api/getDB');

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
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
