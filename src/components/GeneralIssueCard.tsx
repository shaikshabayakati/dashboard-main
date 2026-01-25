'use client';

import React, { useState } from 'react';
import { GeneralIssue } from '@/types/GeneralIssue';
import { getPriorityColor, getRelativeTime, formatTimestamp, getWardLabel, getZoneLabel } from '@/utils/generalIssueHelpers';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface GeneralIssueCardProps {
    issue: GeneralIssue;
    onClose?: () => void;
    isExpanded?: boolean;
}

const GeneralIssueCard: React.FC<GeneralIssueCardProps> = ({ issue, onClose, isExpanded = false }) => {
    const color = getPriorityColor(issue.primaryIssue as any);
    const [showAllDetails, setShowAllDetails] = useState(false); // Default to collapsed
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);
    const [isCorporatorExpanded, setIsCorporatorExpanded] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
            {/* Header */}
            <div
                className="p-3 text-white flex justify-between items-start"
                style={{ backgroundColor: color }}
            >
                <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-lg">
                            {issue.primaryIssue || 'Unknown Issue'}
                        </span>
                    </div>
                    {issue.subCategory && issue.subCategory !== 'None' && (
                        <div className="text-sm opacity-90 mt-1">{issue.subCategory}</div>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Rejection Reason Banner (if not authentic) */}
            {!issue.isAuthentic && issue.rejectionReason && issue.rejectionReason !== 'None' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <div className="flex items-center">
                        <div className="text-sm text-red-700">
                            <span className="font-medium">Rejection Reason: </span>
                            {issue.rejectionReason}
                        </div>
                    </div>
                </div>
            )}

            {/* Image */}
            {issue.imageUrl && (
                <div className="relative h-48 bg-gray-100">
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
            <div className="p-4 space-y-3">
                {/* LLM Summary / Evidence - PROMINENTLY DISPLAYED */}
                {issue.evidence && issue.evidence !== 'None' && issue.evidence.trim() !== '' && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <div className="text-sm font-semibold text-blue-900 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            AI Analysis Summary
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {issue.evidence}
                        </div>
                        {/* Impact Index inside summary block - ONLY for Potholes */}
                        {issue.subCategory === 'Potholes' && (
                            <div className="mt-3 pt-3 border-t border-blue-200 flex items-start justify-between">
                                <div className="flex items-center gap-1 group relative">
                                    <span className="text-sm font-medium text-blue-900 flex items-center gap-1">
                                        📈 Impact Index
                                    </span>
                                    <span className="cursor-help text-blue-400 hover:text-blue-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    {/* Tooltip */}
                                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 bottom-6 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg font-normal">
                                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                        <p className="leading-relaxed">
                                            The impact index is calculated by combining both pothole severity and the traffic conditions. Higher scores highlight locations where severe potholes and traffic levels together create the greatest urgency for repair.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-blue-900 font-bold text-sm">
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

                {/* Location Info */}
                <div>
                    <div className="text-sm font-medium text-gray-900 mb-1">📍 Location</div>
                    <div className="relative">
                        <div
                            className={`text-sm text-gray-600 transition-all duration-300 ${!isAddressExpanded ? 'line-clamp-2' : ''}`}
                        >
                            {issue.address}
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
                    <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                            {getWardLabel(issue.wardNumber)}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                            {getZoneLabel(issue.zone)}
                        </span>
                        {issue.severity && (
                            <span className={`px-2 py-1 rounded font-bold uppercase tracking-wider text-[10px] ${issue.severity.toLowerCase().includes('high') ? 'bg-red-600 text-white' :
                                issue.severity.toLowerCase().includes('medium') ? 'bg-amber-500 text-white' :
                                    'bg-emerald-600 text-white'
                                }`}>
                                {issue.severity}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expandable Details Section */}
                <button
                    onClick={() => setShowAllDetails(!showAllDetails)}
                    className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-200"
                >
                    <span>{showAllDetails ? 'Hide' : 'Show'} Additional Details</span>
                    {showAllDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Additional Details (Expandable) */}
                {showAllDetails && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                        {/* Corporator Info */}
                        {issue.corporatorNameAddress && (
                            <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">👤 Corporator</div>
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
                                <div className="text-sm font-medium text-gray-900 mb-1">🗺️ Coordinates</div>
                                <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                                    {issue.latitude?.toFixed(6)}, {issue.longitude?.toFixed(6)}
                                </div>
                            </div>
                        )}

                        {/* Next Steps (if available) */}
                        {issue.nextStep && Object.keys(issue.nextStep).length > 0 && (
                            <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">📋 Next Steps</div>
                                <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                                    <pre className="whitespace-pre-wrap font-sans">
                                        {JSON.stringify(issue.nextStep, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* User Contact (if available) */}
                        {issue.userPhone && (
                            <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">📞 Reporter Contact</div>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    {issue.userPhone}
                                </div>
                            </div>
                        )}

                        {/* Database Metadata */}
                        <div className="bg-gray-50 p-3 rounded space-y-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Database Information</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Created:</span>
                                    <div className="text-gray-700 font-medium">
                                        {formatTimestamp(issue.createdAt)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Updated:</span>
                                    <div className="text-gray-700 font-medium">
                                        {formatTimestamp(issue.updatedAt)}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Record ID:</span>
                                    <div className="text-gray-700 font-mono font-medium">#{issue.id}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metadata Footer - Always Visible */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span title={formatTimestamp(issue.createdAt)} className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {getRelativeTime(issue.createdAt)}
                    </span>
                    <span className="font-mono">ID: {issue.id}</span>
                </div>
            </div>
        </div>
    );
};

export default GeneralIssueCard;
