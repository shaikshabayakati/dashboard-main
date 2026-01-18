import { useState, useEffect } from 'react';
import { DatabaseGeneralIssue, GeneralIssue } from '@/types/GeneralIssue';
import { DatabasePotholeReport } from '@/types/PotholeReport';
import { mapDatabaseGeneralIssuesToFrontend } from '@/utils/generalIssueMapper';
import { mapPotholeReportsToGeneralIssues } from '@/utils/reportMapper';

interface UseCombinedIssuesReturn {
    issues: GeneralIssue[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Custom hook that fetches and combines both general issues and pothole reports
 * Pothole reports are transformed to match the GeneralIssue interface
 */
export function useCombinedIssues(): UseCombinedIssuesReturn {
    const [issues, setIssues] = useState<GeneralIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch both data sources in parallel
            const [generalIssuesResponse, potholeReportsResponse] = await Promise.all([
                fetch('/api/general-issues'),
                fetch('/api/reports')
            ]);

            // Check for errors
            if (!generalIssuesResponse.ok) {
                throw new Error(`Failed to fetch general issues: ${generalIssuesResponse.statusText}`);
            }
            if (!potholeReportsResponse.ok) {
                throw new Error(`Failed to fetch pothole reports: ${potholeReportsResponse.statusText}`);
            }

            // Parse responses
            const dbGeneralIssues: DatabaseGeneralIssue[] = await generalIssuesResponse.json();
            const dbPotholeReports: DatabasePotholeReport[] = await potholeReportsResponse.json();

            // Map to frontend format
            const mappedGeneralIssues = mapDatabaseGeneralIssuesToFrontend(dbGeneralIssues);
            const mappedPotholeReports = mapPotholeReportsToGeneralIssues(dbPotholeReports);

            // Combine both arrays
            const combinedIssues = [...mappedGeneralIssues, ...mappedPotholeReports];

            // Sort by creation date (newest first)
            combinedIssues.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setIssues(combinedIssues);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Error fetching combined issues:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    return {
        issues,
        isLoading,
        error,
        refetch: fetchIssues
    };
}
