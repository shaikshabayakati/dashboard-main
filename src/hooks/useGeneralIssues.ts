import { useState, useEffect } from 'react';
import { DatabaseGeneralIssue, GeneralIssue } from '@/types/GeneralIssue';
import { mapDatabaseGeneralIssuesToFrontend } from '@/utils/generalIssueMapper';

interface UseGeneralIssuesReturn {
    issues: GeneralIssue[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useGeneralIssues(): UseGeneralIssuesReturn {
    const [issues, setIssues] = useState<GeneralIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/general-issues');

            if (!response.ok) {
                throw new Error(`Failed to fetch general issues: ${response.statusText}`);
            }

            // API returns array directly, not wrapped in {issues: [...]}
            const dbIssues: DatabaseGeneralIssue[] = await response.json();

            // Map database schema to frontend schema
            const mappedIssues = mapDatabaseGeneralIssuesToFrontend(dbIssues);

            setIssues(mappedIssues);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Error fetching general issues:', err);
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
