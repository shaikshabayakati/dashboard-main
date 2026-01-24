/**
 * Z-Score Based Ward Classification System
 * 
 * This module implements statistical classification of wards based on their
 * deviation from the city average, rather than simple ranking.
 * 
 * Classification Rules:
 * - Z > +1.0  → 🔴 HIGH SEVERITY (Significantly worse than average)
 * - 0 ≤ Z ≤ +1.0 → 🟠 MEDIUM SEVERITY (Slightly worse than average)
 * - Z < 0 → 🟢 LOW SEVERITY (Better than average)
 */

export type WardSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WardStats {
    wardId: number;
    wardName: string;
    reportCount: number;
    zScore: number;
    severity: WardSeverity;
    deviationFromAverage: number; // Percentage deviation from mean
}

export interface ZScoreMetrics {
    mean: number;
    standardDeviation: number;
    totalReports: number;
    wardCount: number;
}

export interface WardInput {
    ward_id: number;
    name: string;
    reports: number;
}

/**
 * Calculate the mean (average) of report counts
 */
function calculateMean(reportCounts: number[]): number {
    if (reportCounts.length === 0) return 0;
    const sum = reportCounts.reduce((acc, val) => acc + val, 0);
    return sum / reportCounts.length;
}

/**
 * Calculate the standard deviation of report counts
 */
function calculateStandardDeviation(reportCounts: number[], mean: number): number {
    if (reportCounts.length === 0) return 0;

    const squaredDifferences = reportCounts.map(count => Math.pow(count - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / reportCounts.length;

    return Math.sqrt(variance);
}

/**
 * Calculate Z-score for a single value
 * Z = (value - mean) / standardDeviation
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
    // Handle zero variance case - when all values are identical
    if (stdDev === 0) {
        return 0; // All wards are exactly at the mean
    }

    return (value - mean) / stdDev;
}

/**
 * Determine severity based on Z-score thresholds
 * 
 * - Z > +1.0  → HIGH (Significantly worse than average)
 * - 0 ≤ Z ≤ +1.0 → MEDIUM (Slightly worse than average)
 * - Z < 0 → LOW (Better than average)
 */
function determineSeverity(zScore: number): WardSeverity {
    if (zScore > 1.0) {
        return 'HIGH';
    } else if (zScore >= 0) {
        return 'MEDIUM';
    }
    return 'LOW';
}

/**
 * Calculate percentage deviation from mean
 */
function calculateDeviationPercentage(value: number, mean: number): number {
    if (mean === 0) return 0;
    return ((value - mean) / mean) * 100;
}

/**
 * Main function to compute Z-score classifications for all wards
 * 
 * @param wards - Array of ward data with report counts
 * @returns Object containing ward statistics and global metrics
 */
export function computeWardZScores(wards: WardInput[]): {
    wardStats: WardStats[];
    metrics: ZScoreMetrics;
} {
    if (wards.length === 0) {
        return {
            wardStats: [],
            metrics: {
                mean: 0,
                standardDeviation: 0,
                totalReports: 0,
                wardCount: 0
            }
        };
    }

    // Extract report counts
    const reportCounts = wards.map(w => w.reports);

    // Calculate global metrics
    const mean = calculateMean(reportCounts);
    const standardDeviation = calculateStandardDeviation(reportCounts, mean);
    const totalReports = reportCounts.reduce((acc, val) => acc + val, 0);

    // Calculate Z-scores and classifications for each ward
    const wardStats: WardStats[] = wards.map(ward => {
        const zScore = calculateZScore(ward.reports, mean, standardDeviation);
        const severity = determineSeverity(zScore);
        const deviationFromAverage = calculateDeviationPercentage(ward.reports, mean);

        return {
            wardId: ward.ward_id,
            wardName: ward.name,
            reportCount: ward.reports,
            zScore: Math.round(zScore * 100) / 100, // Round to 2 decimal places
            severity,
            deviationFromAverage: Math.round(deviationFromAverage * 10) / 10 // Round to 1 decimal place
        };
    });

    // Sort by Z-score (descending) so highest severity wards appear first
    wardStats.sort((a, b) => b.zScore - a.zScore);

    return {
        wardStats,
        metrics: {
            mean: Math.round(mean * 100) / 100,
            standardDeviation: Math.round(standardDeviation * 100) / 100,
            totalReports,
            wardCount: wards.length
        }
    };
}

/**
 * Transform issue data to ward input format
 * This is a helper to convert from the GeneralIssue format to WardInput
 */
export function issuesDataToWardInput(issues: { wardNumber: number | null }[]): WardInput[] {
    const wardCounts: Record<number, number> = {};

    issues.forEach(issue => {
        if (issue.wardNumber && issue.wardNumber > 0) {
            wardCounts[issue.wardNumber] = (wardCounts[issue.wardNumber] || 0) + 1;
        }
    });

    return Object.entries(wardCounts).map(([wardId, reports]) => ({
        ward_id: parseInt(wardId),
        name: `Ward ${wardId}`,
        reports
    }));
}

/**
 * Get severity badge color classes
 */
export function getSeverityBadgeColor(severity: WardSeverity): {
    bg: string;
    text: string;
    border: string;
    icon: string;
} {
    switch (severity) {
        case 'HIGH':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-500',
                border: 'border-red-500/20',
                icon: '🔴'
            };
        case 'MEDIUM':
            return {
                bg: 'bg-orange-500/10',
                text: 'text-orange-500',
                border: 'border-orange-500/20',
                icon: '🟠'
            };
        case 'LOW':
            return {
                bg: 'bg-blue-500/10',
                text: 'text-blue-500',
                border: 'border-blue-500/20',
                icon: '🔵'
            };
    }
}

/**
 * Get severity badge dark mode color classes
 */
export function getSeverityBadgeColorDark(severity: WardSeverity): {
    bg: string;
    text: string;
    border: string;
    icon: string;
} {
    switch (severity) {
        case 'HIGH':
            return {
                bg: 'bg-red-400/10',
                text: 'text-red-400',
                border: 'border-red-400/20',
                icon: '🔴'
            };
        case 'MEDIUM':
            return {
                bg: 'bg-orange-400/10',
                text: 'text-orange-400',
                border: 'border-orange-400/20',
                icon: '🟠'
            };
        case 'LOW':
            return {
                bg: 'bg-blue-400/10',
                text: 'text-blue-400',
                border: 'border-blue-400/20',
                icon: '🔵'
            };
    }
}

/**
 * Get Z-score interpretation text
 */
export function getZScoreInterpretation(zScore: number): string {
    if (zScore > 2) {
        return 'Extremely above average';
    } else if (zScore > 1) {
        return 'Significantly above average';
    } else if (zScore > 0.5) {
        return 'Moderately above average';
    } else if (zScore > 0) {
        return 'Slightly above average';
    } else if (zScore === 0) {
        return 'Exactly average';
    } else if (zScore > -0.5) {
        return 'Slightly below average';
    } else if (zScore > -1) {
        return 'Moderately below average';
    } else if (zScore > -2) {
        return 'Significantly below average';
    }
    return 'Extremely below average';
}
