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


            {/* Stats Overview */}


            {/* Filters */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Ward Filter */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        Filter by Ward
                    </label>
                    <select
                        value={selectedWard || ''}
                        onChange={(e) => handleWardChange(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white shadow-md hover:shadow-lg hover:border-blue-400/50 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        Filter by Zone
                    </label>
                    <select
                        value={selectedZone || ''}
                        onChange={(e) => handleZoneChange(e.target.value || null)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white shadow-md hover:shadow-lg hover:border-blue-400/50 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        Filter by Issue Type
                    </label>
                    <select
                        value={selectedIssueType || ''}
                        onChange={(e) => handleIssueTypeChange((e.target.value as PrimaryIssueType) || null)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white shadow-md hover:shadow-lg hover:border-blue-400/50 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                    >
                        <option value="">All Types</option>
                        <option value="Road">Road ({stats.byType['Road'] || 0})</option>
                        <option value="Footpath">Footpath ({stats.byType['Footpath'] || 0})</option>
                        <option value="Electricity">Electricity ({stats.byType['Electricity'] || 0})</option>
                        <option value="Garbage/sewage">Garbage/Sewage ({stats.byType['Garbage/sewage'] || 0})</option>
                        <option value="Stray animals">Stray Animals ({stats.byType['Stray animals'] || 0})</option>
                    </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedWard || selectedZone || selectedIssueType) && (
                    <button
                        onClick={handleClearFilters}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg border border-red-200/50 hover:border-red-300"
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
                            Top Severity Wards
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
