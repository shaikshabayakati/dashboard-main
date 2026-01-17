'use client';

import React, { useState } from 'react';
import { GeneralIssue } from '@/types/GeneralIssue';
import { getPriorityColor, getRelativeTime, formatTimestamp, getWardLabel, getZoneLabel, getShortAddress } from '@/utils/generalIssueHelpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface GeneralIssueReportCardProps {
    issue: GeneralIssue;
    onImageClick?: (imageUrl: string) => void;
}

const GeneralIssueReportCard: React.FC<GeneralIssueReportCardProps> = ({ issue, onImageClick }) => {
    const color = getPriorityColor(issue.primaryIssue as any);
    const [showDetails, setShowDetails] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
            {/* Image Thumbnail */}
            {issue.imageUrl && (
                <div
                    className="w-full h-40 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity relative"
                    onClick={() => onImageClick?.(issue.imageUrl!)}
                >
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <img
                        src={issue.imageUrl}
                        alt="Issue"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <div
                            className="inline-block px-2 py-1 rounded text-white text-xs font-semibold mb-1"
                            style={{ backgroundColor: color }}
                        >
                            {issue.primaryIssue || 'Unknown'}
                        </div>
                        {issue.subCategory && issue.subCategory !== 'None' && (
                            <span className="ml-2 text-xs text-gray-500">({issue.subCategory})</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        {issue.severity && (
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${issue.severity.toLowerCase().includes('high') ? 'bg-red-100 text-red-700' :
                                issue.severity.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {issue.severity}
                            </span>
                        )}
                        {issue.isAuthentic && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ✓ Verified
                            </span>
                        )}
                        {!issue.isAuthentic && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                ⚠ Unverified
                            </span>
                        )}
                    </div>
                </div>

                {/* LLM Summary - Always Visible */}
                {issue.evidence && issue.evidence !== 'None' && issue.evidence.trim() !== '' && (
                    <div className="bg-blue-50 border-l-2 border-blue-500 p-2 rounded mb-2">
                        <div className="text-xs font-semibold text-blue-900 mb-1">🤖 AI Analysis</div>
                        <div className="text-xs text-gray-700 line-clamp-2 whitespace-pre-wrap">
                            {issue.evidence}
                        </div>
                    </div>
                )}

                {/* Address */}
                <div className="text-sm text-gray-700 mb-2 truncate" title={issue.address}>
                    📍 {getShortAddress(issue.address)}
                </div>

                {/* Ward and Zone */}
                <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {getWardLabel(issue.wardNumber)}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {getZoneLabel(issue.zone)}
                    </span>
                    {issue.isIssuePresent && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            ⚠ Confirmed
                        </span>
                    )}
                </div>

                {/* Expandable Details Toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-200"
                >
                    <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* Expandable Details */}
                {showDetails && (
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                        {/* Full Evidence */}
                        {issue.evidence && issue.evidence !== 'None' && issue.evidence.trim() !== '' && (
                            <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs font-semibold text-blue-900 mb-1">Full AI Analysis</div>
                                <div className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {issue.evidence}
                                </div>
                            </div>
                        )}

                        {/* Corporator Info */}
                        {issue.corporatorNameAddress && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">👤 Corporator</div>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    {issue.corporatorNameAddress}
                                </div>
                            </div>
                        )}

                        {/* Coordinates */}
                        {(issue.latitude !== null && issue.longitude !== null) && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">🗺️ Coordinates</div>
                                <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                                    {issue.latitude?.toFixed(6)}, {issue.longitude?.toFixed(6)}
                                </div>
                            </div>
                        )}



                        {/* Reporter Contact */}
                        {issue.userPhone && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">📞 Reporter</div>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    {issue.userPhone}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Database Info</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Created:</span>
                                    <div className="text-gray-700">{formatTimestamp(issue.createdAt)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Updated:</span>
                                    <div className="text-gray-700">{formatTimestamp(issue.updatedAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer - Always Visible */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span title={formatTimestamp(issue.createdAt)}>
                        {getRelativeTime(issue.createdAt)}
                    </span>
                    <span className="font-mono">ID: {issue.id}</span>
                </div>
            </div>
        </div>
    );
};

export default GeneralIssueReportCard;
