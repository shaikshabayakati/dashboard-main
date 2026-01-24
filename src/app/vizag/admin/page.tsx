'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSettingsModal from '@/components/AdminSettingsModal';
import {
    getScoringMode,
    setScoringMode,
    getIssueWeights,
    IssueWeights
} from '@/utils/weightedScoringUtils';

export default function VizagAdminPage() {
    const router = useRouter();
    const [scoringMode, setScoringModeState] = useState<'statistical' | 'weighted'>('statistical');
    const [weights, setWeights] = useState<IssueWeights>(getIssueWeights());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load scoring mode from localStorage on mount
    useEffect(() => {
        setScoringModeState(getScoringMode());
        setWeights(getIssueWeights());
    }, []);

    // Handle mode toggle
    const handleModeToggle = (newMode: 'statistical' | 'weighted') => {
        setScoringModeState(newMode);
        setScoringMode(newMode);
    };

    // Handle weights update from admin modal
    const handleWeightsUpdate = (newWeights: IssueWeights) => {
        setWeights(newWeights);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/vizag')}
                                className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
                                <p className="text-sm text-gray-500">Configure ward scoring system</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${scoringMode === 'statistical'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {scoringMode === 'statistical' ? 'Statistical Mode' : 'Weighted Mode'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scoring Mode Selection */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Scoring Mode</h2>
                                <p className="text-sm text-gray-500">Choose how wards are ranked</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Statistical Mode Option */}
                            <button
                                onClick={() => handleModeToggle('statistical')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${scoringMode === 'statistical'
                                    ? 'border-purple-500 bg-purple-50/50'
                                    : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scoringMode === 'statistical'
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-slate-300'
                                                }`}>
                                                {scoringMode === 'statistical' && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-slate-900">Statistical (Z-Score)</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-7">
                                            Ranks wards based on statistical deviation from the city average.
                                            Uses Z-scores to identify wards with significantly more or fewer issues.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Weighted Mode Option */}
                            <button
                                onClick={() => handleModeToggle('weighted')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${scoringMode === 'weighted'
                                    ? 'border-blue-500 bg-blue-50/50'
                                    : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scoringMode === 'weighted'
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-slate-300'
                                                }`}>
                                                {scoringMode === 'weighted' && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-slate-900">Priority Weighted</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-7">
                                            Ranks wards based on custom priority weights for each issue type.
                                            Allows you to emphasize certain types of issues over others.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Weight Configuration (only visible in weighted mode) */}
                    {scoringMode === 'weighted' && (
                        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Priority Weights</h2>
                                    <p className="text-sm text-gray-500">Adjust issue type priorities</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Current Weights Display */}
                                <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Weights</h3>
                                    <div className="space-y-2">
                                        {Object.entries(weights).map(([type, weight]) => (
                                            <div key={type} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700">{type}</span>
                                                <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 rounded font-semibold text-sm border border-orange-200">
                                                    {weight}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Adjust Weights Button */}
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Adjust Weights
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 ${scoringMode === 'weighted' ? '' : 'lg:col-span-1'
                        }`}>
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">How it works</h3>
                                <div className="text-sm text-gray-600 space-y-2">
                                    {scoringMode === 'statistical' ? (
                                        <>
                                            <p>
                                                <strong>Z-Score Based Ranking:</strong> Wards are ranked by how much they deviate
                                                from the city average using statistical analysis.
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                <li><strong>HIGH</strong>: Z &gt; +1.0 (significantly above average)</li>
                                                <li><strong>MEDIUM</strong>: 0 ≤ Z ≤ +1.0 (slightly above average)</li>
                                                <li><strong>LOW</strong>: Z &lt; 0 (below average)</li>
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <p>
                                                <strong>Weighted Scoring:</strong> Each ward's score is calculated as the sum of
                                                (issue count × priority weight) for each issue type.
                                            </p>
                                            <p className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-xs">
                                                Score = Σ(count × weight)
                                            </p>
                                            <p>
                                                Higher weights (8-10) indicate critical issues. Lower weights (1-3) are for
                                                less urgent matters. Adjust weights to reflect your priorities.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <div>
                        <p className="text-sm text-gray-500">
                            Changes are saved automatically and will be reflected on the main dashboard.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/vizag')}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Admin Settings Modal */}
            <AdminSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleWeightsUpdate}
                isDarkMode={false}
            />
        </div>
    );
}
