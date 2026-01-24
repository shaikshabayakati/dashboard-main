'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    computeWardZScores,
    issuesDataToWardInput,
    getSeverityBadgeColor,
    getSeverityBadgeColorDark,
    getZScoreInterpretation,
    WardStats,
    ZScoreMetrics
} from '@/utils/wardZScoreUtils';
import {
    computeWeightedWardScores,
    IssueWeights,
    WeightedWardStats
} from '@/utils/weightedScoringUtils';

interface WardLeaderboardProps {
    issues: { wardNumber: number | null; primaryIssue?: string | null }[];
    isDarkMode?: boolean;
    maxItems?: number;
    showMetrics?: boolean;
    scoringMode?: 'statistical' | 'weighted';
    weights?: IssueWeights;
}

const WardLeaderboard: React.FC<WardLeaderboardProps> = ({
    issues,
    isDarkMode = false,
    maxItems = 10,
    showMetrics = true,
    scoringMode = 'statistical',
    weights
}) => {
    const router = useRouter();
    const [showAll, setShowAll] = useState(false);
    const [hoveredWard, setHoveredWard] = useState<number | null>(null);

    // Compute scores based on selected mode
    const { wardStats, metrics } = useMemo(() => {
        if (scoringMode === 'weighted') {
            const weighted = computeWeightedWardScores(issues, weights);
            // Convert WeightedWardStats to WardStats format
            return {
                wardStats: weighted.wardStats.map(w => ({
                    wardId: w.wardId,
                    wardName: w.wardName,
                    reportCount: w.reportCount,
                    zScore: w.zScore,
                    severity: w.severity,
                    deviationFromAverage: w.deviationFromAverage,
                    weightedScore: w.weightedScore
                })) as any,
                metrics: {
                    mean: weighted.metrics.mean,
                    standardDeviation: weighted.metrics.standardDeviation,
                    totalReports: weighted.metrics.totalReports,
                    wardCount: weighted.metrics.wardCount
                }
            };
        } else {
            const wardInputs = issuesDataToWardInput(issues);
            return computeWardZScores(wardInputs);
        }
    }, [issues, scoringMode, weights]);

    const displayedWards = showAll ? wardStats : wardStats.slice(0, maxItems);

    const getSeverityColors = (severity: WardStats['severity']) => {
        return isDarkMode ? getSeverityBadgeColorDark(severity) : getSeverityBadgeColor(severity);
    };

    // Handle ward card click - navigate to view page with ward filter
    const handleWardClick = (wardId: number) => {
        router.push(`/vizag/view?ward=${wardId}`);
    };

    // Count wards by severity
    const severityCounts = useMemo(() => {
        return wardStats.reduce((acc: Record<string, number>, ward: WardStats) => {
            acc[ward.severity] = (acc[ward.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [wardStats]);

    if (wardStats.length === 0) {
        return (
            <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No ward data available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Ward Cards */}
            <div className="space-y-2">
                {displayedWards.map((ward: WardStats, index: number) => {
                    const colors = getSeverityColors(ward.severity);
                    const isHovered = hoveredWard === ward.wardId;

                    return (
                        <div
                            key={ward.wardId}
                            className={`
                                p-3 rounded-xl border transition-all duration-200 cursor-pointer
                                ${isDarkMode
                                    ? `bg-[#13141a] ${isHovered ? 'bg-[#1a1b23] border-purple-500/30' : 'border-gray-800 hover:border-gray-700'}`
                                    : `bg-white ${isHovered ? 'shadow-md border-purple-300' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`
                                }
                            `}
                            onClick={() => handleWardClick(ward.wardId)}
                            onMouseEnter={() => setHoveredWard(ward.wardId)}
                            onMouseLeave={() => setHoveredWard(null)}
                        >
                            <div className="flex items-center justify-between gap-3">
                                {/* Left Section: Ward Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Rank Number */}
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                                        ${index < 3
                                            ? isDarkMode
                                                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-400'
                                                : 'bg-gradient-to-br from-orange-100 to-red-100 text-orange-600'
                                            : isDarkMode
                                                ? 'bg-gray-800 text-gray-400'
                                                : 'bg-slate-100 text-slate-500'
                                        }
                                    `}>
                                        #{index + 1}
                                    </div>

                                    {/* Ward Name */}
                                    <div className="min-w-0">
                                        <div className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {ward.wardName}
                                        </div>
                                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {ward.reportCount} reports
                                        </div>
                                    </div>
                                </div>

                                {/* Center Section: Z-Score or Weighted Score */}
                                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                                    <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {scoringMode === 'weighted' ? 'Weighted Score' : 'Z-Score'}
                                    </div>
                                    <div className={`
                                        text-lg font-bold tabular-nums
                                        ${scoringMode === 'weighted'
                                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                            : ward.zScore > 0 ? 'text-red-500' : ward.zScore < 0 ? 'text-blue-500' : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }
                                    `}>
                                        {scoringMode === 'weighted'
                                            ? (ward as any).weightedScore?.toFixed(1) || '0.0'
                                            : `${ward.zScore > 0 ? '+' : ''}${ward.zScore.toFixed(2)}`
                                        }
                                    </div>
                                </div>

                                {/* Right Section: Deviation (statistical only) & Severity */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* Deviation from Average - only show in statistical mode */}
                                    {scoringMode === 'statistical' && (
                                        <div className="text-right hidden sm:block">
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Deviation
                                            </div>
                                            <div className={`
                                                text-sm font-semibold
                                                ${ward.deviationFromAverage > 0 ? 'text-red-500' : ward.deviationFromAverage < 0 ? 'text-blue-500' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                                            `}>
                                                {ward.deviationFromAverage > 0 ? '+' : ''}{ward.deviationFromAverage.toFixed(1)}%
                                            </div>
                                        </div>
                                    )}

                                    {/* Severity Badge */}
                                    <div className={`
                                        px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5
                                        ${colors.bg} ${colors.text} ${colors.border}
                                    `}>
                                        <span>{colors.icon}</span>
                                        <span>{ward.severity}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Tooltip on Hover */}
                            {isHovered && (
                                <div className={`
                                    mt-3 pt-3 border-t text-xs
                                    ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-slate-100 text-gray-500'}
                                `}>
                                    <span className="font-medium">Interpretation:</span>{' '}
                                    {getZScoreInterpretation(ward.zScore)} — {' '}
                                    {ward.severity === 'HIGH'
                                        ? 'This ward has significantly more issues than most other wards and needs urgent attention.'
                                        : ward.severity === 'MEDIUM'
                                            ? 'This ward has slightly more issues than most wards.'
                                            : 'This ward has fewer issues than most wards.'
                                    }
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show More/Less Button */}
            {wardStats.length > maxItems && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className={`
                        w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isDarkMode
                            ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                        }
                    `}
                >
                    {showAll ? `Show Top ${maxItems} Only` : `Show All ${wardStats.length} Wards`}
                </button>
            )}

            {/* Legend */}
            <div className={`
                p-3 rounded-lg text-xs space-y-1.5
                ${isDarkMode ? 'bg-[#1a1b23] border border-gray-800' : 'bg-slate-50 border border-slate-200'}
            `}>
                <div className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                    📝 Classification Guide
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5">
                        <span>🔴</span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <strong className="text-red-500">HIGH</strong>: Z {'>'} 1.0 (Significantly worse)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>🟠</span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <strong className="text-orange-500">MEDIUM</strong>: 0 ≤ Z ≤ 1.0 (Slightly worse)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>🔵</span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <strong className="text-blue-500">LOW</strong>: Z {'<'} 0 (Fewer issues)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WardLeaderboard;
