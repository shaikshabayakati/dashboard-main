'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { usePotholeReports } from '@/hooks/usePotholeReports';
import { useGeographic } from '@/contexts/GeographicContext';
import { PotholeReport } from '@/types/PotholeReport';

export default function StatsView() {
  const { reports, isLoading, error } = usePotholeReports();
  const { districts, getMandalsForSelectedDistrict, filterReportsByLocation } = useGeographic();

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [mandalFilter, setMandalFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Sort states
  type SortColumn = 'datetime' | 'severity' | 'impact';
  type SortOrder = 'asc' | 'desc';
  const [sortColumn, setSortColumn] = useState<SortColumn>('datetime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Default: newest first
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadedImages, setLoadedImages] = useState<Record<string, string[]>>({});
  const observerRef = useRef<HTMLTableRowElement | null>(null);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(10);
  }, [severityFilter, locationFilter, districtFilter, mandalFilter, startDate, endDate, sortColumn, sortOrder]);

  // Get available mandals for selected district
  const availableMandals = useMemo(() => {
    if (!districtFilter) return [];
    return getMandalsForSelectedDistrict(districtFilter);
  }, [districtFilter, getMandalsForSelectedDistrict]);

  // Calculate geographic statistics
  const stats = useMemo(() => {
    const total = reports.length;

    // Count by district
    const districtCounts: Record<string, number> = {};
    reports.forEach(r => {
      const district = r.district || 'Unknown';
      districtCounts[district] = (districtCounts[district] || 0) + 1;
    });

    // Count by mandal
    const mandalCounts: Record<string, number> = {};
    reports.forEach(r => {
      const mandal = r.mandal || 'Unknown';
      mandalCounts[mandal] = (mandalCounts[mandal] || 0) + 1;
    });

    // Get top 3 districts and mandals
    const topDistricts = Object.entries(districtCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topMandals = Object.entries(mandalCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      total,
      topDistricts,
      topMandals,
    };
  }, [reports]);

  // Load images for a specific report
  const handleLoadImages = async (reportId: string, imageUrls: string[]) => {
    setLoadedImages(prev => ({
      ...prev,
      [reportId]: imageUrls
    }));
  };

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    // First apply geographic filtering
    let filtered = filterReportsByLocation(reports, districtFilter || null, mandalFilter || null);

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(r => r.severityLabel === severityFilter);
    }

    // Location text filter
    if (locationFilter) {
      filtered = filtered.filter(r =>
        r.address?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        r.roadName?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.timestamp) <= end);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortColumn === 'datetime') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortColumn === 'severity') {
        // Custom severity ordering: low < medium < high
        const severityOrder = { low: 1, medium: 2, high: 3 };
        const aSeverity = severityOrder[a.severityLabel as keyof typeof severityOrder] || 0;
        const bSeverity = severityOrder[b.severityLabel as keyof typeof severityOrder] || 0;
        comparison = aSeverity - bSeverity;
      } else if (sortColumn === 'impact') {
        comparison = (a.impactScore || 0) - (b.impactScore || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [reports, filterReportsByLocation, districtFilter, mandalFilter, severityFilter, locationFilter, startDate, endDate, sortColumn, sortOrder]);

  // Infinite scroll logic
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 10);
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredReports.length) {
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
  }, [visibleCount, filteredReports.length, loadMore]);

  // Get visible reports based on pagination
  const visibleReports = useMemo(() => {
    return filteredReports.slice(0, visibleCount);
  }, [filteredReports, visibleCount]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc'); // Default to desc for new column
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0b0d] text-white' : 'bg-gray-50 text-gray-900'} flex`}>
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
          {/* Severity Filter */}
          <div>
            <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Pothole Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Location</label>
            <input
              type="text"
              placeholder="Search address/road name..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* District Filter */}
          <div>
            <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>District</label>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setMandalFilter(''); // Reset mandal when district changes
              }}
              className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* Mandal Filter */}
          <div>
            <label className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Mandal</label>
            <select
              value={mandalFilter}
              onChange={(e) => setMandalFilter(e.target.value)}
              disabled={!districtFilter || availableMandals.length === 0}
              className={`w-full ${isDarkMode ? 'bg-[#1a1b23] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {districtFilter ? `All Mandals in ${districtFilter}` : 'Select district first'}
              </option>
              {availableMandals.map((mandal) => (
                <option key={mandal} value={mandal}>
                  {mandal}
                </option>
              ))}
            </select>
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
          {(severityFilter !== 'all' || locationFilter || districtFilter || mandalFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setSeverityFilter('all');
                setLocationFilter('');
                setDistrictFilter('');
                setMandalFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Clear Filters
            </button>
          )}

          <div className={`text-sm ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-200'} pt-2 border-t font-medium`}>
            Showing {filteredReports.length} of {reports.length} reports
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
              <h1 className="text-xl font-bold">Dashboard Analytics</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overview of pothole reports</p>
            </div>
          </div>
        </div>

        {/* Stats Cards and Reports - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Reports List */}
            <div className={`${isDarkMode ? 'bg-[#13141a] border-gray-800' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm`}>
              <div className={`px-4 py-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} border-b`}>
                <h2 className="text-base font-semibold">Reports List</h2>
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
                      <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase w-[40%]`}>
                        Location
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} uppercase cursor-pointer select-none transition-colors w-[14%]`}
                        onClick={() => handleSort('severity')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            Severity
                            <div
                              className="relative"
                              onMouseEnter={() => setTooltipVisible('severity')}
                              onMouseLeave={() => setTooltipVisible(null)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className={`w-3 h-3 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} cursor-help transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              {tooltipVisible === 'severity' && (
                                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 ${isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-300'} border rounded-lg p-3 shadow-xl z-[9999] text-xs font-normal normal-case leading-relaxed`}>
                                  <div className="font-semibold mb-1">AI-Powered Severity Assessment</div>
                                  <div>Our AI model analyzes visual characteristics of pothole damage including depth, surface area, edge definition, and structural impact to classify severity into Low, Medium, or High categories with precise confidence scoring.</div>
                                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 ${isDarkMode ? 'border-l-transparent border-r-transparent border-b-gray-900' : 'border-l-transparent border-r-transparent border-b-white'}`}></div>
                                </div>
                              )}
                            </div>
                          </span>
                          {getSortIcon('severity')}
                        </div>
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} uppercase cursor-pointer select-none transition-colors w-[15%]`}
                        onClick={() => handleSort('impact')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            Impact Index
                            <div
                              className="relative"
                              onMouseEnter={() => setTooltipVisible('impact')}
                              onMouseLeave={() => setTooltipVisible(null)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className={`w-3 h-3 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} cursor-help transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              {tooltipVisible === 'impact' && (
                                <div className={`absolute top-full right-0 mt-2 w-72 ${isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-300'} border rounded-lg p-3 shadow-xl z-[9999] text-xs font-normal normal-case leading-relaxed`}>
                                  <div className="font-semibold mb-1">Traffic-Weighted Impact Analysis</div>
                                  <div>The impact index is calculated by combining both pothole severity and the traffic conditions. Higher scores highlight locations where severe potholes and traffic levels together create the greatest urgency for repair.</div>
                                  <div className={`absolute bottom-full right-0 w-0 h-0 border-l-4 border-r-4 border-b-4 ${isDarkMode ? 'border-l-transparent border-r-transparent border-b-gray-900' : 'border-l-transparent border-r-transparent border-b-white'}`}></div>
                                </div>
                              )}
                            </div>
                          </span>
                          {getSortIcon('impact')}
                        </div>
                      </th>
                      <th className="px-4 py-3 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'} divide-y`}>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-base`}>
                          No reports found matching the filters
                        </td>
                      </tr>
                    ) : (
                      visibleReports.map((report) => (
                        <React.Fragment key={report.id}>
                          <tr
                            className={`${isDarkMode ? 'hover:bg-[#1a1b23]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                            onClick={() => setExpandedRow(expandedRow === report.id ? null : report.id)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{report.id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {new Date(report.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(report.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-xs truncate font-medium`}>
                                {report.district || 'Unknown'} - {report.mandal || 'Unknown'}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} max-w-xs truncate`}>
                                {report.roadName || 'Unknown Road'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getSeverityColor(report.severityLabel)}`}>
                                {report.severityLabel.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                {report.impactScore ? report.impactScore.toFixed(1) : 'N/A'}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <svg
                                className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform ${expandedRow === report.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </td>
                          </tr>
                          {expandedRow === report.id && (
                            <tr>
                              <td colSpan={6} className={`px-4 py-4 ${isDarkMode ? 'bg-[#0f1014]' : 'bg-gray-50'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>District:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1 font-medium`}>{report.district || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Mandal:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1 font-medium`}>{report.mandal || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Full Address:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.address || 'N/A'}</p>
                                  </div>

                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Road Name:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.roadName || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Potholes Detected:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.detectionCount || 0}</p>
                                  </div>
                                  <div>
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Confidence Score:</span>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.severity ? (report.severity * 100).toFixed(1) + '%' : 'N/A'}</p>
                                  </div>
                                  {report.roadOwnership && (
                                    <div>
                                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Road Ownership:</span>
                                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.roadOwnership}</p>
                                    </div>
                                  )}
                                  {report.roadAuthority && (
                                    <div>
                                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Road Authority:</span>
                                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mt-1`}>{report.roadAuthority}</p>
                                    </div>
                                  )}
                                  {report.images && report.images.length > 0 && (
                                    <div className="col-span-full">
                                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Citizen Uploaded Image:</span>
                                      {!loadedImages[report.id] ? (
                                        <div className="mt-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleLoadImages(report.id, report.images);
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
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                          {loadedImages[report.id].map((img, idx) => (
                                            <img
                                              key={idx}
                                              src={img}
                                              alt={`Report ${idx + 1}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImage(img);
                                              }}
                                              className={`w-24 h-24 object-cover rounded border ${isDarkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-300 hover:border-purple-500'} cursor-pointer transition-all hover:scale-105`}
                                            />
                                          ))}
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
                    {visibleCount < filteredReports.length && (
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
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          style={{ overflow: 'hidden' }}
        >
          {/* Close Button - Fixed at top-right corner */}
          <button
            onClick={() => setSelectedImage(null)}
            className="fixed top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-2xl transition-colors z-[110]"
            title="Close (ESC)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Container */}
          <div className="relative max-w-7xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
