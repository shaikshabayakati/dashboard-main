'use client';

import React, { useState, useMemo } from 'react';
import { GeneralIssue, PrimaryIssueType } from '@/types/GeneralIssue';
import {
    computeWardZScores,
    issuesDataToWardInput,
    getSeverityBadgeColor,
    WardStats
} from '@/utils/wardZScoreUtils';

interface VizagSidebarProps {
    issues: GeneralIssue[];
    onFilterChange: (filters: { ward: number | null; zone: string | null; issueType: PrimaryIssueType | null }) => void;
    showIssuesSidebar: boolean;
}

const COLORS: Record<string, string> = {
    'Road': '#DC2626',
    'Footpath': '#3B82F6',
    'Electricity': '#F59E0B',
    'Garbage/sewage': '#EA580C',
    'Stray animals': '#8B5CF6'
};

const VizagSidebar: React.FC<VizagSidebarProps> = ({ issues, onFilterChange, showIssuesSidebar }) => {
    const [selectedWard, setSelectedWard] = useState<number | null>(null);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedIssueType, setSelectedIssueType] = useState<PrimaryIssueType | null>(null);

    // Calculate stats
    const stats = useMemo(() => {
        const total = issues.length;
        const byType: Record<string, number> = {};
        const byZone: Record<string, number> = {};
        const byWard: Record<number, number> = {};

        issues.forEach(issue => {
            const type = issue.primaryIssue || 'Unknown';
            byType[type] = (byType[type] || 0) + 1;

            if (issue.zone) {
                byZone[issue.zone] = (byZone[issue.zone] || 0) + 1;
            }

            if (issue.wardNumber) {
                byWard[issue.wardNumber] = (byWard[issue.wardNumber] || 0) + 1;
            }
        });

        // Filter out 'None' or 'Unknown' categories from stats
        ['None', 'Unknown', 'none', 'unknown'].forEach(key => {
            delete byType[key];
            delete byZone[key];
            // @ts-ignore
            delete byWard[key];
        });

        return { total, byType, byZone, byWard };
    }, [issues]);

    // Compute Z-scores for wards
    const wardZScoreData = useMemo(() => {
        const wardInputs = issuesDataToWardInput(issues);
        return computeWardZScores(wardInputs);
    }, [issues]);

    const handleWardChange = (ward: number | null) => {
        setSelectedWard(ward);
        onFilterChange({ ward, zone: selectedZone, issueType: selectedIssueType });
    };

    const handleZoneChange = (zone: string | null) => {
        setSelectedZone(zone);
        onFilterChange({ ward: selectedWard, zone, issueType: selectedIssueType });
    };

    const handleIssueTypeChange = (issueType: PrimaryIssueType | null) => {
        setSelectedIssueType(issueType);
        onFilterChange({ ward: selectedWard, zone: selectedZone, issueType });
    };

    const handleClearFilters = () => {
        setSelectedWard(null);
        setSelectedZone(null);
        setSelectedIssueType(null);
        onFilterChange({ ward: null, zone: null, issueType: null });
    };

    return (
        <div
            className={`absolute top-0 left-0 h-full bg-white shadow-xl z-40 flex flex-col border-r border-gray-200 transition-all duration-300 ${showIssuesSidebar ? 'w-72' : 'w-80'
                }`}
        >
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                    <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="384" height="21.3334" fill="#F97316" />
                        <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                        <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.86 7.19386 428.994 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.856 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.976 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.774 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.977C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 383.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347C128.021 385.347 128.042 385.347 128.062 385.347Z" fill="#F97316" />
                        <path d="M128 384V512H256L128 384Z" fill="#F97316" />
                    </svg>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Municipal Issues</h1>
                        <p className="text-sm text-gray-500">Visakhapatnam</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}


            {/* Filters */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Ward Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Ward
                    </label>
                    <select
                        value={selectedWard || ''}
                        onChange={(e) => handleWardChange(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                        <option value="">All Wards</option>
                        {Object.keys(stats.byWard).sort((a, b) => parseInt(a) - parseInt(b)).map(ward => (
                            <option key={ward} value={ward}>
                                Ward {ward} ({stats.byWard[parseInt(ward)]} issues)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Zone Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Zone
                    </label>
                    <select
                        value={selectedZone || ''}
                        onChange={(e) => handleZoneChange(e.target.value || null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                        <option value="">All Zones</option>
                        {Object.keys(stats.byZone).sort().map(zone => (
                            <option key={zone} value={zone}>
                                Zone {zone} ({stats.byZone[zone]} issues)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Issue Type Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Issue Type
                    </label>
                    <select
                        value={selectedIssueType || ''}
                        onChange={(e) => handleIssueTypeChange((e.target.value as PrimaryIssueType) || null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                        <option value="">All Types</option>
                        <option value="Road">🛣️ Road ({stats.byType['Road'] || 0})</option>
                        <option value="Footpath">🚶 Footpath ({stats.byType['Footpath'] || 0})</option>
                        <option value="Electricity">⚡ Electricity ({stats.byType['Electricity'] || 0})</option>
                        <option value="Garbage/sewage">🗑️ Garbage/Sewage ({stats.byType['Garbage/sewage'] || 0})</option>
                        <option value="Stray animals">🐕 Stray Animals ({stats.byType['Stray animals'] || 0})</option>
                    </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedWard || selectedZone || selectedIssueType) && (
                    <button
                        onClick={handleClearFilters}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                        Clear All Filters
                    </button>
                )}

                {/* Issue Type Breakdown */}
                <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Breakdown</div>
                    <div className="space-y-1.5">
                        {Object.entries(stats.byType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 truncate flex-1">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: COLORS[type] || '#CBD5E1' }}
                                    ></div>
                                    <span className="text-gray-600 truncate">{type}</span>
                                </div>
                                <span className="font-semibold text-gray-900 ml-2">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Severity Wards - Z-Score Based */}
                {wardZScoreData.wardStats.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span>📊</span> Top Severity Wards
                            <span className="ml-auto text-[10px] font-normal text-purple-500">Z-Score</span>
                        </div>
                        <div className="space-y-1.5">
                            {wardZScoreData.wardStats.slice(0, 5).map((ward) => {
                                const colors = getSeverityBadgeColor(ward.severity);
                                return (
                                    <div
                                        key={ward.wardId}
                                        className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleWardChange(ward.wardId)}
                                    >
                                        <div className="flex items-center gap-2 truncate flex-1">
                                            <span className={`text-xs ${colors.icon === '🔴' ? 'text-red-500' : colors.icon === '🟠' ? 'text-orange-500' : 'text-green-500'}`}>
                                                {colors.icon}
                                            </span>
                                            <span className="text-gray-700 truncate">{ward.wardName}</span>
                                            <span className="text-gray-400 text-xs">({ward.reportCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-xs font-mono ${ward.zScore > 0 ? 'text-red-500' : ward.zScore < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                                {ward.zScore > 0 ? '+' : ''}{ward.zScore.toFixed(1)}
                                            </span>
                                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors.bg} ${colors.text}`}>
                                                {ward.severity}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded">
                            μ = {wardZScoreData.metrics.mean.toFixed(1)} reports/ward | σ = ±{wardZScoreData.metrics.standardDeviation.toFixed(1)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VizagSidebar;
