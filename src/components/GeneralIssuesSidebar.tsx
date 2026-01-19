'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GeneralIssue, PrimaryIssueType } from '@/types/GeneralIssue';
import GeneralIssueReportCard from './GeneralIssueReportCard';
import { X, Filter, MapPin, AlertTriangle } from 'lucide-react';

interface GeneralIssuesSidebarProps {
    wardNumber?: number;
    zoneName?: string;
    issues: GeneralIssue[];
    onClose: () => void;
    isVisible: boolean;
}

type SortOption = 'recent' | 'oldest' | 'severity-desc' | 'severity-asc';
type IssueTypeFilter = 'all' | PrimaryIssueType;

const GeneralIssuesSidebar: React.FC<GeneralIssuesSidebarProps> = ({
    wardNumber,
    zoneName,
    issues,
    onClose,
    isVisible
}) => {
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [issueTypeFilter, setIssueTypeFilter] = useState<IssueTypeFilter>('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const observerRef = useRef<HTMLDivElement | null>(null);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(10);
    }, [sortBy, issueTypeFilter, issues]);

    // Filter and sort issues
    const filteredAndSortedIssues = useMemo(() => {
        let filtered = [...issues];

        // Apply sorting
        filtered.sort((a, b) => {
            const getSeverityScore = (severity: string | null) => {
                const s = (severity || '').toLowerCase();
                if (s.includes('high')) return 3;
                if (s.includes('medium')) return 2;
                if (s.includes('low')) return 1;
                return 0;
            };

            switch (sortBy) {
                case 'recent':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'severity-desc':
                    return getSeverityScore(b.severity) - getSeverityScore(a.severity);
                case 'severity-asc':
                    return getSeverityScore(a.severity) - getSeverityScore(b.severity);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [issues, sortBy]);

    // Infinite scroll logic
    const loadMore = useCallback(() => {
        setVisibleCount(prev => prev + 10);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredAndSortedIssues.length) {
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
    }, [visibleCount, filteredAndSortedIssues.length, loadMore]);

    // Get visible issues based on pagination
    const visibleIssues = useMemo(() => {
        return filteredAndSortedIssues.slice(0, visibleCount);
    }, [filteredAndSortedIssues, visibleCount]);

    // Calculate issue type counts
    const issueTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        issues.forEach(i => {
            const type = i.primaryIssue || 'Unknown';
            counts[type] = (counts[type] || 0) + 1;
        });
        return counts;
    }, [issues]);

    if (!isVisible) return null;

    return (
        <>
            <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <h2 className="text-base font-bold text-gray-900">
                                {wardNumber ? `Ward ${wardNumber}` : zoneName ? `Zone ${zoneName}` : 'Selected Area'}
                            </h2>
                        </div>
                        {wardNumber && zoneName && (
                            <p className="text-xs text-gray-600 mt-1">
                                Zone {zoneName}
                            </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                    {filteredAndSortedIssues.length} of {issues.length} Issues
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                        aria-label="Close sidebar"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Filters Section */}
                <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 space-y-2">
                    <div>
                        <label className="flex items-center text-xs font-medium text-gray-700 mb-2">
                            <Filter className="w-3 h-3 mr-1 text-blue-600" />
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-all duration-200"
                        >
                            <option value="recent">📅 Most Recent</option>
                            <option value="oldest">⏰ Oldest First</option>
                            <option value="severity-desc">🔥 Severity (High to Low)</option>
                            <option value="severity-asc">🧊 Severity (Low to High)</option>
                        </select>
                    </div>


                </div>

                {/* Issues List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredAndSortedIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <div className="text-gray-400 mb-4">
                                <AlertTriangle className="w-16 h-16" />
                            </div>
                            <p className="text-gray-500 font-medium text-center">
                                {issues.length === 0 ? 'No issues in this area' : 'No issues match the filters'}
                            </p>
                            <p className="text-gray-400 text-sm text-center mt-2">
                                {issues.length === 0
                                    ? 'Issues will appear here when available'
                                    : 'Try adjusting your filters'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 p-4">
                                {visibleIssues.map((issue) => (
                                    <div key={issue.id} className="transform transition-transform hover:scale-[1.01]">
                                        <GeneralIssueReportCard
                                            issue={issue}
                                            onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Infinite scroll observer */}
                            {visibleCount < filteredAndSortedIssues.length && (
                                <div ref={observerRef} className="h-4 w-full" />
                            )}
                        </>
                    )}
                </div>

                {/* Quick Stats at Bottom */}

            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-2xl transition-colors z-[110]"
                        title="Close (ESC)"
                    >
                        <X className="w-6 h-6" />
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
            )}
        </>
    );
};

export default GeneralIssuesSidebar;
