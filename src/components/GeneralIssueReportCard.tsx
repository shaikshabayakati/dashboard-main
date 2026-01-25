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
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);
    const [isCorporatorExpanded, setIsCorporatorExpanded] = useState(false);

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
                        {/* Verification badges removed */}
                    </div>
                </div>

                {/* LLM Summary - Always Visible */}
                {issue.evidence && issue.evidence !== 'None' && issue.evidence.trim() !== '' && (
                    <div className="bg-blue-50 border-l-2 border-blue-500 p-2 rounded mb-2">
                        <div className="text-xs font-semibold text-blue-900 mb-1">🤖 AI Analysis</div>
                        <div className="text-xs text-gray-700 line-clamp-2 whitespace-pre-wrap">
                            {issue.evidence}
                        </div>
                        {/* Impact Index inside summary block - ONLY for Potholes */}
                        {issue.subCategory === 'Potholes' && (
                            <div className="mt-2 pt-2 border-t border-blue-200 flex items-start justify-between">
                                <div className="flex items-center gap-1 group relative">
                                    <span className="text-[10px] font-medium text-blue-900 flex items-center gap-1">
                                        📈 Impact Index
                                    </span>
                                    <span className="cursor-help text-blue-400 hover:text-blue-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    {/* Tooltip */}
                                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 bottom-6 z-50 w-60 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg font-normal">
                                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                        <p className="leading-tight">
                                            The impact index is calculated by combining pothole severity and traffic conditions. Higher scores indicate greater urgency.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-blue-900 font-bold text-[10px]">
                                    {issue.impactScore !== null && issue.impactScore !== undefined
                                        ? Number(issue.impactScore).toFixed(1)
                                        : (issue as any).impact_score !== null && (issue as any).impact_score !== undefined
                                            ? Number((issue as any).impact_score).toFixed(1)
                                            : 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Address */}
                <div className="relative mb-2">
                    <div
                        className={`text-sm text-gray-700 transition-all duration-300 ${!isAddressExpanded ? 'line-clamp-2' : ''}`}
                        title={issue.address}
                    >
                        📍 {issue.address || 'Address not available'}
                    </div>
                    {issue.address && issue.address.length > 50 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAddressExpanded(!isAddressExpanded);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold mt-1 flex items-center gap-1"
                        >
                            {isAddressExpanded ? 'Show less' : '... see more'}
                        </button>
                    )}
                </div>

                {/* Ward and Zone */}
                <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {getWardLabel(issue.wardNumber)}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {getZoneLabel(issue.zone)}
                    </span>

                    {issue.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${issue.severity.toLowerCase().includes('high') ? 'bg-red-600 text-white' :
                            issue.severity.toLowerCase().includes('medium') ? 'bg-amber-500 text-white' :
                                'bg-emerald-600 text-white'
                            }`}>
                            {issue.severity}
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
                                <div className="bg-gray-50 p-2 rounded transition-all duration-300">
                                    <div className="text-xs text-gray-600">
                                        {!isCorporatorExpanded ? (
                                            <>
                                                {issue.corporatorNameAddress.split(',')[0]}
                                                {issue.corporatorNameAddress.includes(',') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsCorporatorExpanded(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
                                                    >
                                                        ... (show more)
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {issue.corporatorNameAddress}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsCorporatorExpanded(false);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-semibold ml-2 block mt-1"
                                                >
                                                    show less
                                                </button>
                                            </>
                                        )}
                                    </div>
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
