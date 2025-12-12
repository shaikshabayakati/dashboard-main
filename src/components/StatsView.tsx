'use client';

import React, { useState, useMemo } from 'react';
import { usePotholeReports } from '@/hooks/usePotholeReports';
import { PotholeReport } from '@/types/PotholeReport';

export default function StatsView() {
  const { reports, isLoading, error } = usePotholeReports();
  
  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'severity' | 'impact'>('recent');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Calculate geographic statistics
  const stats = useMemo(() => {
    const total = reports.length;
    
    // Count by district
    const districtCounts: Record<string, number> = {};
    reports.forEach(r => {
      const district = r.district || 'Unknown';
      districtCounts[district] = (districtCounts[district] || 0) + 1;
    });
    
    // Count by mandal/subdistrict
    const mandalCounts: Record<string, number> = {};
    reports.forEach(r => {
      const mandal = r.subDistrict || 'Unknown';
      mandalCounts[mandal] = (mandalCounts[mandal] || 0) + 1;
    });
    
    // Get top 3 districts and mandals
    const topDistricts = Object.entries(districtCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
      
    const topMandals = Object.entries(mandalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return {
      total,
      topDistricts,
      topMandals,
    };
  }, [reports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(r => r.severityLabel === severityFilter);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(r => 
        r.address?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        r.roadName?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        r.district?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        r.subDistrict?.toLowerCase().includes(locationFilter.toLowerCase())
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
      if (sortBy === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'severity') {
        return (b.severity || 0) - (a.severity || 0);
      } else {
        return (b.impactScore || 0) - (a.impactScore || 0);
      }
    });

    return filtered;
  }, [reports, severityFilter, locationFilter, startDate, endDate, sortBy]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex">
      {/* Collapsible Filter Sidebar */}
      <div className={`bg-[#13141a] border-r border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {/* Severity Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Location</label>
            <input
              type="text"
              placeholder="Search..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Sort By</label>
            <div className="space-y-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-purple-500 text-white'
                    : 'bg-[#1a1b23] text-gray-400 hover:bg-gray-800'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('severity')}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'severity'
                    ? 'bg-purple-500 text-white'
                    : 'bg-[#1a1b23] text-gray-400 hover:bg-gray-800'
                }`}
              >
                Severity
              </button>
              <button
                onClick={() => setSortBy('impact')}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'impact'
                    ? 'bg-purple-500 text-white'
                    : 'bg-[#1a1b23] text-gray-400 hover:bg-gray-800'
                }`}
              >
                Impact Score
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(severityFilter !== 'all' || locationFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setSeverityFilter('all');
                setLocationFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Clear Filters
            </button>
          )}

          <div className="text-xs text-gray-400 pt-2 border-t border-gray-800">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-30 bg-[#13141a] p-2 rounded-lg border border-gray-800 hover:bg-[#1a1b23] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Dashboard Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Overview of pothole reports</p>
        </div>

        {/* Stats Cards */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Reports Card */}
            <div className="bg-[#13141a] rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">Total Reports</span>
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </div>

            {/* Top Districts Card */}
            <div className="bg-[#13141a] rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-gray-400 text-xs font-semibold">Top Districts</span>
              </div>
              <div className="space-y-1">
                {stats.topDistricts.map(([district, count], idx) => (
                  <div key={district} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300">{idx + 1}. {district}</span>
                    <span className="text-purple-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Mandals Card */}
            <div className="bg-[#13141a] rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 text-xs font-semibold">Top Mandals</span>
              </div>
              <div className="space-y-1">
                {stats.topMandals.map(([mandal, count], idx) => (
                  <div key={mandal} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300">{idx + 1}. {mandal}</span>
                    <span className="text-green-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-[#13141a] rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-semibold">Reports List</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1b23] border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      Severity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      Impact Score
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No reports found matching the filters
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <React.Fragment key={report.id}>
                        <tr 
                          className="hover:bg-[#1a1b23] transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === report.id ? null : report.id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs font-mono text-gray-300">#{report.id.slice(0, 8)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-300">
                              {new Date(report.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(report.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-300 max-w-xs truncate">
                              {report.district || 'Unknown'} - {report.subDistrict || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {report.roadName || 'Unknown Road'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(report.severityLabel)}`}>
                              {report.severityLabel.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                  style={{ width: `${Math.min((report.impactScore || 0) / 10 * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 font-medium min-w-[35px]">
                                {report.impactScore ? report.impactScore.toFixed(1) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">
                              {report.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${expandedRow === report.id ? 'rotate-180' : ''}`}
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
                            <td colSpan={7} className="px-4 py-4 bg-[#0f1014]">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500">Full Address:</span>
                                  <p className="text-gray-300 mt-1">{report.address || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Coordinates:</span>
                                  <p className="text-gray-300 mt-1">{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Road Type:</span>
                                  <p className="text-gray-300 mt-1">{report.roadType || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Detection Count:</span>
                                  <p className="text-gray-300 mt-1">{report.detectionCount || 0}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Confidence:</span>
                                  <p className="text-gray-300 mt-1">{report.confidence ? (report.confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Severity Score:</span>
                                  <p className="text-gray-300 mt-1">{report.severity ? (report.severity * 100).toFixed(1) + '%' : 'N/A'}</p>
                                </div>
                                {report.roadOwnership && (
                                  <div>
                                    <span className="text-gray-500">Road Ownership:</span>
                                    <p className="text-gray-300 mt-1">{report.roadOwnership}</p>
                                  </div>
                                )}
                                {report.roadAuthority && (
                                  <div>
                                    <span className="text-gray-500">Road Authority:</span>
                                    <p className="text-gray-300 mt-1">{report.roadAuthority}</p>
                                  </div>
                                )}
                                {report.distanceToRoad !== null && report.distanceToRoad !== undefined && (
                                  <div>
                                    <span className="text-gray-500">Distance to Road:</span>
                                    <p className="text-gray-300 mt-1">{report.distanceToRoad.toFixed(2)}m</p>
                                  </div>
                                )}
                                {report.images && report.images.length > 0 && (
                                  <div className="col-span-full">
                                    <span className="text-gray-500">Images:</span>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      {report.images.map((img, idx) => (
                                        <img 
                                          key={idx} 
                                          src={img} 
                                          alt={`Report ${idx + 1}`}
                                          className="w-20 h-20 object-cover rounded border border-gray-700"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
