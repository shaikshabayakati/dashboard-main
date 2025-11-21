"use client";
import { useEffect, useState, useCallback } from 'react';
import { PotholeReport } from '../types/PotholeReport';

export function usePotholeReports() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // A. Hit the API
      const response = await fetch('/api/getDB');

      // B. Convert response to JSON
      const data = await response.json();

      // C. Check if we got an error
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');

      // D. Save data to State
      setReports(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false); // Stop loading spinner
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { reports, isLoading, error, refetch: fetchData };
}