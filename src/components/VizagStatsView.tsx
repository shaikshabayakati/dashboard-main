'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCombinedIssues } from '@/hooks/useCombinedIssues';
import { GeneralIssue, PrimaryIssueType, SubCategoryType } from '@/types/GeneralIssue';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'] });

const ExpandableText = ({
    text,
    isDarkMode,
    maxChars = 100,
    showAddressPattern = false
}: {
    text: string | null | undefined;
    isDarkMode: boolean;
    maxChars?: number;
    showAddressPattern?: boolean;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return <span>N/A</span>;

    const shouldTruncate = showAddressPattern ? text.includes(',') : text.length > maxChars;

    if (!shouldTruncate) return <span>{text}</span>;

    const displayText = isExpanded
        ? text
        : (showAddressPattern ? text.split(',')[0] : text.slice(0, maxChars));

    return (
        <>
            {displayText}
            {!isExpanded && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                    className="text-blue-500 hover:text-blue-700 font-semibold ml-1"
                >
                    ... (show more)
                </button>
            )}
            {isExpanded && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                    className="text-blue-500 hover:text-blue-700 font-semibold ml-2"
                >
                    show less
                </button>
            )}
        </>
    );
};

export default function VizagStatsView() {
    const { issues: allIssues, isLoading, error } = useCombinedIssues();
    const searchParams = useSearchParams();

    // Filter: only verified reports with valid ward assignments
    const issues = useMemo(() =>
        allIssues.filter(issue =>
            issue.wardNumber &&
            issue.wardNumber > 0 &&
            issue.isAuthentic === true
        ),
        [allIssues]
    );

    // Filter states (removed verificationFilter)
    const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
    const [wardFilter, setWardFilter] = useState<string>('');
    const [zoneFilter, setZoneFilter] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Sort states
    type SortColumn = 'datetime' | 'issueType' | 'severity';
    type SortOrder = 'asc' | 'desc';
    const [sortColumn, setSortColumn] = useState<SortColumn>('datetime');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [loadedImages, setLoadedImages] = useState<Record<number, string>>({});
    const observerRef = useRef<HTMLTableRowElement | null>(null);

    // Read ward parameter from URL and set it as filter
    React.useEffect(() => {
        const wardParam = searchParams.get('ward');
        if (wardParam) {
            setWardFilter(wardParam);
        }
    }, [searchParams]);

    // Reset pagination when filters change
    React.useEffect(() => {
        setVisibleCount(10);
    }, [issueTypeFilter, wardFilter, zoneFilter, locationFilter, startDate, endDate, severityFilter, sortColumn, sortOrder]);

    // Calculate stats for filters
    const stats = useMemo(() => {
        const wards = new Set<number>();
        const zones = new Set<string>();

        issues.forEach(issue => {
            if (issue.wardNumber) wards.add(issue.wardNumber);
            if (issue.zone) zones.add(issue.zone);
        });

        return {
            total: issues.length,
            wards: Array.from(wards).sort((a, b) => a - b),
            zones: Array.from(zones).sort()
        };
    }, [issues]);

    // Load image for a specific issue
    const handleLoadImage = async (issueId: number, imageUrl: string) => {
        setLoadedImages(prev => ({
            ...prev,
            [issueId]: imageUrl
        }));
    };

    // Filter and sort issues
    const filteredIssues = useMemo(() => {
        let filtered = [...issues];

        // Issue Type filter
        if (issueTypeFilter !== 'all') {
            filtered = filtered.filter(i => i.primaryIssue === issueTypeFilter);
        }

        // Ward filter
        if (wardFilter) {
            filtered = filtered.filter(i => i.wardNumber === parseInt(wardFilter));
        }

        // Zone filter
        if (zoneFilter) {
            filtered = filtered.filter(i => i.zone === zoneFilter);
        }

        // Removed: Verification filter (all issues are verified)

        // Location text filter
        if (locationFilter) {
            filtered = filtered.filter(i =>
                i.address?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        // Date filter
        if (startDate) {
            filtered = filtered.filter(i => new Date(i.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(i => i.createdAt ? new Date(i.createdAt) <= end : true);
        }

        // Severity filter
        if (severityFilter !== 'all') {
            filtered = filtered.filter(i => (i.severity || '').toLowerCase() === severityFilter.toLowerCase());
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            if (sortColumn === 'datetime') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortColumn === 'issueType') {
                comparison = (a.primaryIssue || '').localeCompare(b.primaryIssue || '');
            } else if (sortColumn === 'severity') {
                const getSeverityScore = (severity: string | null) => {
                    const s = (severity || '').toLowerCase();
                    if (s.includes('high')) return 3;
                    if (s.includes('medium')) return 2;
                    if (s.includes('low')) return 1;
                    return 0;
                };
                comparison = getSeverityScore(a.severity) - getSeverityScore(b.severity);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [issues, issueTypeFilter, wardFilter, zoneFilter, locationFilter, startDate, endDate, severityFilter, sortColumn, sortOrder]);

    // Infinite scroll logic
    const loadMore = useCallback(() => {
        setVisibleCount(prev => prev + 10);
    }, []);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredIssues.length) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentObserver = observerRef.current;
        if (currentObserver) {
            observer.observe(currentObserver);
        }

        return () => {
            if (currentObserver) {
                observer.unobserve(currentObserver);
            }
        };
    }, [visibleCount, filteredIssues.length, loadMore]);

    // Get visible issues based on pagination
    const visibleIssues = useMemo(() => {
        return filteredIssues.slice(0, visibleCount);
    }, [filteredIssues, visibleCount]);

    const getIssueTypeColor = (issueType: string | null) => {
        switch (issueType) {
            case 'Road': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Footpath': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Electricity': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Garbage/sewage': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'Stray animals': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getSeverityColor = (severity: string | null) => {
        const s = (severity || '').toLowerCase();
        if (s.includes('high')) return 'text-red-400 bg-red-400/10 border-red-400/20';
        if (s.includes('medium')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        if (s.includes('low')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('desc');
        }
    };

    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return (
                <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            );
        }

        return sortOrder === 'asc' ? (
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0b0d]' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0b0d]' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="text-red-400">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className={`h-screen ${isDarkMode ? 'bg-[#0a0b0d] text-white' : 'bg-gray-50 text-gray-900'} flex ${outfit.className}`}>
            {/* Collapsible Filter Sidebar */}
            <div className={`
                ${isDarkMode
                    ? 'bg-[#13141a]/95 border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
                    : 'bg-white/95 border-gray-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
                } 
                border-r backdrop-blur-xl transition-all duration-300 
                ${sidebarOpen ? 'w-72' : 'w-0'} 
                overflow-hidden flex-shrink-0 relative z-20 h-full
            `}>
                <div className={`
                    p-4 
                    ${isDarkMode
                        ? 'border-gray-800/50 bg-gradient-to-r from-purple-900/10 to-transparent'
                        : 'border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-transparent'
                    } 
                    border-b flex items-center justify-between backdrop-blur-sm
                `}>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                    </h2>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Issue Type Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Issue Type</label>
                        <select
                            value={issueTypeFilter}
                            onChange={(e) => setIssueTypeFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        >
                            <option value="all">All Types</option>
                            <option value="Road">Road</option>
                            <option value="Footpath">Footpath</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Garbage/sewage">Garbage/Sewage</option>
                            <option value="Stray animals">Stray Animals</option>
                        </select>
                    </div>

                    {/* Ward Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Ward Number</label>
                        <select
                            value={wardFilter}
                            onChange={(e) => setWardFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        >
                            <option value="">All Wards</option>
                            {stats.wards.map((ward) => (
                                <option key={ward} value={ward}>
                                    Ward {ward}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Zone Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Zone</label>
                        <select
                            value={zoneFilter}
                            onChange={(e) => setZoneFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        >
                            <option value="">All Zones</option>
                            {stats.zones.map((zone) => (
                                <option key={zone} value={zone}>
                                    Zone {zone}
                                </option>
                            ))}
                        </select>
                    </div>



                    {/* Location Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Location</label>
                        <input
                            type="text"
                            placeholder="Search address..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white placeholder-gray-500 shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 placeholder-gray-400 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200`}
                        />
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        />
                    </div>
                    {/* Clear Filters */}
                    {(issueTypeFilter !== 'all' || wardFilter || zoneFilter || locationFilter || startDate || endDate || severityFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setIssueTypeFilter('all');
                                setWardFilter('');
                                setZoneFilter('');
                                setLocationFilter('');
                                setStartDate('');
                                setEndDate('');
                                setSeverityFilter('all');
                            }}
                            className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all duration-200 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                        >
                            Clear Filters
                        </button>
                    )}

                    {/* Severity Filter in Sidebar */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Severity</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700/50 text-white shadow-lg shadow-black/20' : 'bg-white border-gray-300/50 text-gray-900 shadow-md shadow-gray-200/50'} border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400/50 transition-all duration-200 cursor-pointer`}
                        >
                            <option value="all">All Severities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div className={`text-sm ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-200'} pt-2 border-t font-medium`}>
                        Showing {filteredIssues.length} of {issues.length} issues
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-screen flex flex-col relative">

                {/* Issues List - Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <div className={`${isDarkMode ? 'bg-[#13141a] border-gray-800' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm`}>
                            <div className={`px-4 py-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} border-b`}>
                                <h2 className="text-base font-semibold">Issues List</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={`${isDarkMode ? 'bg-[#1a1b23] border-gray-800' : 'bg-gray-50 border-gray-200'} border-b`}>
                                        <tr>
                                            <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase w-[8%]`}>
                                                ID
                                            </th>
                                            <th
                                                className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} uppercase cursor-pointer select-none transition-colors w-[18%]`}
                                                onClick={() => handleSort('datetime')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Date & Time
                                                    {getSortIcon('datetime')}
                                                </div>
                                            </th>
                                            <th
                                                className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} uppercase cursor-pointer select-none transition-colors w-[20%]`}
                                                onClick={() => handleSort('issueType')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Issue Type
                                                    {getSortIcon('issueType')}
                                                </div>
                                            </th>
                                            <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase w-[15%]`}>
                                                Ward / Zone
                                            </th>
                                            <th
                                                className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} uppercase cursor-pointer select-none transition-colors w-[12%]`}
                                                onClick={() => handleSort('severity')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Severity
                                                    {getSortIcon('severity')}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 w-[5%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'} divide-y`}>
                                        {filteredIssues.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-base`}>
                                                    No issues found matching the filters
                                                </td>
                                            </tr>
                                        ) : (
                                            visibleIssues.map((issue) => (
                                                <React.Fragment key={issue.id}>
                                                    <tr
                                                        className={`${isDarkMode ? 'hover:bg-[#1a1b23]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                                                        onClick={() => setExpandedRow(expandedRow === issue.id ? null : issue.id)}
                                                    >
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{issue.id}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {new Date(issue.createdAt).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                            <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                {new Date(issue.createdAt).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getIssueTypeColor(issue.primaryIssue)}`}>
                                                                {issue.primaryIssue || 'Unknown'}
                                                            </span>
                                                            {issue.subCategory && issue.subCategory !== 'None' && (
                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                                                    {issue.subCategory === 'Potholes' ? 'Pothole' : issue.subCategory}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                Ward {issue.wardNumber || 'N/A'}
                                                            </div>
                                                            <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                Zone {issue.zone || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getSeverityColor(issue.severity)}`}>
                                                                {issue.severity || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <svg
                                                                className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform ${expandedRow === issue.id ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </td>
                                                    </tr>
                                                    {expandedRow === issue.id && (
                                                        <tr>
                                                            <td colSpan={6} className={`px-4 py-4 ${isDarkMode ? 'bg-[#0f1014]' : 'bg-gray-50'}`}>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
                                                                    {/* AI Analysis Summary */}
                                                                    {issue.evidence && issue.evidence !== 'None' && (
                                                                        <div className="col-span-full">
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>AI Analysis Summary:</span>
                                                                            <p className={`${isDarkMode ? 'text-gray-300 bg-blue-500/10' : 'text-gray-800 bg-blue-50'} mt-1 p-3 rounded-lg border ${isDarkMode ? 'border-blue-500/20' : 'border-blue-200'} whitespace-pre-wrap`}>
                                                                                {issue.evidence}

                                                                                {/* Impact Index inside summary box */}
                                                                                {/* Impact Index inside summary block - ONLY for Potholes */}
                                                                                {issue.subCategory === 'Potholes' && (
                                                                                    <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-blue-500/20' : 'border-blue-200'} flex items-center justify-between`}>
                                                                                        <div className="flex items-center gap-1 group relative">
                                                                                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs font-medium flex items-center gap-1`}>
                                                                                                📈 Impact Index
                                                                                            </span>
                                                                                            <span className="cursor-help text-gray-400 hover:text-gray-600 transition-colors">
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                                                                </svg>
                                                                                            </span>
                                                                                            {/* Tooltip */}
                                                                                            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 bottom-full mb-2 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg font-normal">
                                                                                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                                                                                <p className="leading-relaxed">
                                                                                                    The impact index is calculated by combining pothole severity and traffic conditions. Higher scores indicate greater urgency for repair.
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-700'} font-bold text-sm`}>
                                                                                            {issue.impactScore !== null && issue.impactScore !== undefined
                                                                                                ? Number(issue.impactScore).toFixed(1)
                                                                                                : (issue as any).impact_score !== null && (issue as any).impact_score !== undefined
                                                                                                    ? Number((issue as any).impact_score).toFixed(1)
                                                                                                    : '0.0'}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Full Address:</span>
                                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}><ExpandableText text={issue.address} isDarkMode={isDarkMode} maxChars={80} /></p>
                                                                    </div>

                                                                    <div>
                                                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Ward Number:</span>
                                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1 font-semibold`}>
                                                                            {issue.wardNumber ? `Ward ${issue.wardNumber}` : 'N/A'}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Zone:</span>
                                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1 font-semibold`}>
                                                                            {issue.zone ? `Zone ${issue.zone}` : 'N/A'}
                                                                        </p>
                                                                    </div>

                                                                    {issue.corporatorNameAddress && (
                                                                        <div className="col-span-full">
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Corporator Details:</span>
                                                                            <p className={`${isDarkMode ? 'text-gray-300 bg-purple-500/10' : 'text-gray-800 bg-purple-50'} mt-1 p-3 rounded-lg border ${isDarkMode ? 'border-purple-500/20' : 'border-purple-200'}`}>
                                                                                <ExpandableText text={issue.corporatorNameAddress} isDarkMode={isDarkMode} showAddressPattern={true} />
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Coordinates:</span>
                                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1 font-mono text-sm`}>
                                                                            {issue.latitude?.toFixed(6)}, {issue.longitude?.toFixed(6)}
                                                                        </p>
                                                                    </div>

                                                                    {issue.userPhone && (
                                                                        <div>
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Reporter Contact:</span>
                                                                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{issue.userPhone}</p>
                                                                        </div>
                                                                    )}

                                                                    {issue.rejectionReason && issue.rejectionReason !== 'None' && (
                                                                        <div>
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Rejection Reason:</span>
                                                                            <p className={`${isDarkMode ? 'text-red-300' : 'text-red-600'} mt-1`}>{issue.rejectionReason}</p>
                                                                        </div>
                                                                    )}

                                                                    {issue.imageUrl && (
                                                                        <div className="col-span-full">
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Citizen Uploaded Image:</span>
                                                                            {!loadedImages[issue.id] ? (
                                                                                <div className="mt-2">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleLoadImage(issue.id, issue.imageUrl!);
                                                                                        }}
                                                                                        className={`px-4 py-2 text-sm rounded-md font-medium transition-colors shadow-sm hover:shadow ${isDarkMode
                                                                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                                                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                                                                                            }`}
                                                                                    >
                                                                                        Load Image
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="mt-2">
                                                                                    <img
                                                                                        src={loadedImages[issue.id]}
                                                                                        alt="Issue"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setSelectedImage(loadedImages[issue.id]);
                                                                                        }}
                                                                                        className={`w-32 h-32 object-cover rounded border ${isDarkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-300 hover:border-purple-500'} cursor-pointer transition-all hover:scale-105`}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                        {/* Infinite scroll observer */}
                                        {visibleCount < filteredIssues.length && (
                                            <tr ref={observerRef}>
                                                <td colSpan={6} className="h-4"></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                        style={{ overflow: 'hidden' }}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="fixed top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-2xl transition-colors z-[110]"
                            title="Close (ESC)"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="relative max-w-7xl max-h-[90vh] p-4">
                            <img
                                src={selectedImage}
                                alt="Enlarged view"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
