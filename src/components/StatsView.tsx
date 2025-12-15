'use client';

import React, { useState } from 'react';
import { usePotholeReports } from '@/hooks/usePotholeReports';

export default function StatsView() {
  const { reports, isLoading, error } = usePotholeReports();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      {/* Header */}
      <div className="py-6 px-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Pothole Reports Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Total Reports: {reports.length}</p>
      </div>

      {/* Reports List */}
      <div className="p-6">
        <div className="bg-[#13141a] rounded-lg border border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">All Reports</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1b23] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-base">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <React.Fragment key={report.id}>
                      <tr
                        className="hover:bg-[#1a1b23] transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === report.id ? null : report.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-300">#{report.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {new Date(report.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(report.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300 max-w-xs truncate font-medium">
                            {report.district || 'Unknown'} - {report.mandal || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {report.roadName || 'Unknown Road'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getSeverityColor(report.severityLabel)}`}>
                            {report.severityLabel.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-400/10 text-blue-500 border border-blue-400/20">
                            {report.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedRow === report.id ? 'rotate-180' : ''}`}
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
                          <td colSpan={6} className="px-6 py-4 bg-[#0f1014]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
                              <div>
                                <span className="text-gray-500">District:</span>
                                <p className="text-gray-300 mt-1 font-medium">{report.district || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Mandal:</span>
                                <p className="text-gray-300 mt-1 font-medium">{report.mandal || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Full Address:</span>
                                <p className="text-gray-300 mt-1">{report.address || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Coordinates:</span>
                                <p className="text-gray-300 mt-1">{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Road Name:</span>
                                <p className="text-gray-300 mt-1">{report.roadName || 'N/A'}</p>
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
                              <div>
                                <span className="text-gray-500">Impact Score:</span>
                                <p className="text-gray-300 mt-1">{report.impactScore ? report.impactScore.toFixed(1) : 'N/A'}</p>
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
                              {report.images && report.images.length > 0 && (
                                <div className="col-span-full">
                                  <span className="text-gray-500">Images:</span>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {report.images.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt={`Report ${idx + 1}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedImage(img);
                                        }}
                                        className="w-24 h-24 object-cover rounded border border-gray-700 hover:border-purple-500 cursor-pointer transition-all hover:scale-105"
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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          style={{ overflow: 'hidden' }}
        >
          {/* Close Button */}
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
