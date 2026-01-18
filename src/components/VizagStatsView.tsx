'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useCombinedIssues } from '@/hooks/useCombinedIssues';
import { GeneralIssue, PrimaryIssueType, SubCategoryType } from '@/types/GeneralIssue';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'] });

export default function VizagStatsView() {
    const { issues, isLoading, error } = useCombinedIssues();

    // Filter states
    const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
    const [wardFilter, setWardFilter] = useState<string>('');
    const [zoneFilter, setZoneFilter] = useState<string>('');
    const [verificationFilter, setVerificationFilter] = useState<string>('all');
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
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [loadedImages, setLoadedImages] = useState<Record<number, string>>({});
    const observerRef = useRef<HTMLTableRowElement | null>(null);

    // Reset pagination when filters change
    React.useEffect(() => {
        setVisibleCount(10);
    }, [issueTypeFilter, wardFilter, zoneFilter, verificationFilter, locationFilter, startDate, endDate, severityFilter, sortColumn, sortOrder]);

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

        // Verification filter
        if (verificationFilter !== 'all') {
            filtered = filtered.filter(i =>
                verificationFilter === 'verified' ? i.isAuthentic : !i.isAuthentic
            );
        }

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
    }, [issues, issueTypeFilter, wardFilter, zoneFilter, verificationFilter, locationFilter, startDate, endDate, sortColumn, sortOrder]);

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
        if (s.includes('low')) return 'text-green-400 bg-green-400/10 border-green-400/20';
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
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0b0d] text-white' : 'bg-gray-50 text-gray-900'} flex ${outfit.className}`}>
            {/* Collapsible Filter Sidebar */}
            <div className={`${isDarkMode ? 'bg-[#13141a] border-gray-800' : 'bg-white border-gray-200'} border-r transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden flex-shrink-0`}>
                <div className={`p-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} border-b flex items-center justify-between`}>
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
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        >
                            <option value="all">All Types</option>
                            <option value="Road">🛣️ Road</option>
                            <option value="Footpath">🚶 Footpath</option>
                            <option value="Electricity">⚡ Electricity</option>
                            <option value="Garbage/sewage">🗑️ Garbage/Sewage</option>
                            <option value="Stray animals">🐕 Stray Animals</option>
                        </select>
                    </div>

                    {/* Ward Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Ward Number</label>
                        <select
                            value={wardFilter}
                            onChange={(e) => setWardFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        >
                            <option value="">All Zones</option>
                            {stats.zones.map((zone) => (
                                <option key={zone} value={zone}>
                                    Zone {zone}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Verification Status Filter */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Verification Status</label>
                        <select
                            value={verificationFilter}
                            onChange={(e) => setVerificationFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        >
                            <option value="all">All Status</option>
                            <option value="verified">✓ Verified</option>
                            <option value="unverified">⚠ Unverified</option>
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
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                    </div>
                    {/* Clear Filters */}
                    {(issueTypeFilter !== 'all' || wardFilter || zoneFilter || verificationFilter !== 'all' || locationFilter || startDate || endDate) && (
                        <button
                            onClick={() => {
                                setIssueTypeFilter('all');
                                setWardFilter('');
                                setZoneFilter('');
                                setVerificationFilter('all');
                                setLocationFilter('');
                                setStartDate('');
                                setEndDate('');
                                setSeverityFilter('all');
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
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
                            className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        >
                            <option value="all">All Severities</option>
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                    </div>

                    <div className={`text-sm ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-200'} pt-2 border-t font-medium`}>
                        Showing {filteredIssues.length} of {issues.length} issues
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-screen flex flex-col">
                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`fixed top-4 ${sidebarOpen ? 'left-[304px]' : 'left-4'} z-30 ${isDarkMode ? 'bg-[#13141a] border-gray-800 hover:bg-[#1a1b23]' : 'bg-white border-gray-300 hover:bg-gray-50'} p-3 rounded-lg border-2 transition-all duration-300 shadow-lg`}
                    title={sidebarOpen ? 'Close Filters' : 'Open Filters'}
                >
                    <svg className={`w-5 h-5 transition-transform duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>

                {/* Theme Toggle Button */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`fixed top-4 right-4 z-30 ${isDarkMode ? 'bg-[#13141a] border-gray-800 hover:bg-[#1a1b23]' : 'bg-white border-gray-300 hover:bg-gray-50'} p-2 rounded-lg border transition-colors`}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? (
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </button>

                {/* Header */}
                <div className={`py-4 pr-4 ${sidebarOpen ? 'pl-24' : 'pl-20'} ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} border-b flex-shrink-0 transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                        <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="384" height="21.3334" fill="#F97316" />
                            <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                            <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.86 7.19386 428.994 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.856 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.976 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.774 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.977C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 383.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347C128.021 385.347 128.042 385.347 128.062 385.347Z" fill="#F97316" />
                            <path d="M128 384V512H256L128 384Z" fill="#F97316" />
                        </svg>
                        <div>
                            <h1 className="text-xl font-bold">Vizag Issues Analytics</h1>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overview of general issues</p>
                        </div>
                    </div>
                </div>

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
                                            <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase w-[12%]`}>
                                                Status
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
                                                <td colSpan={7} className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-base`}>
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
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getIssueTypeColor(issue.primaryIssue)}`}>
                                                                    {issue.primaryIssue || 'Unknown'}
                                                                </span>
                                                                {issue.subCategory === 'Potholes' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-400/20">
                                                                        🕳️ Pothole
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {issue.subCategory && issue.subCategory !== 'None' && issue.subCategory !== 'Potholes' && (
                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                                                    {issue.subCategory}
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
                                                            <div className="flex flex-wrap gap-1">
                                                                {issue.isAuthentic && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                                                                        ✓ Verified
                                                                    </span>
                                                                )}
                                                                {!issue.isAuthentic && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                                                        ⚠ Unverified
                                                                    </span>
                                                                )}
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
                                                            <td colSpan={7} className={`px-4 py-4 ${isDarkMode ? 'bg-[#0f1014]' : 'bg-gray-50'}`}>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
                                                                    {/* AI Analysis Summary */}
                                                                    {issue.evidence && issue.evidence !== 'None' && (
                                                                        <div className="col-span-full">
                                                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>AI Analysis Summary:</span>
                                                                            <p className={`${isDarkMode ? 'text-gray-300 bg-blue-500/10' : 'text-gray-800 bg-blue-50'} mt-1 p-3 rounded-lg border ${isDarkMode ? 'border-blue-500/20' : 'border-blue-200'} whitespace-pre-wrap`}>
                                                                                {issue.evidence}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Full Address:</span>
                                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{issue.address || 'N/A'}</p>
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
                                                                                {issue.corporatorNameAddress}
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
                                                <td colSpan={7} className="h-4"></td>
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
