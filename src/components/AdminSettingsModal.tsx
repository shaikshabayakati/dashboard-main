'use client';

import React, { useState, useEffect } from 'react';
import {
    IssueWeights,
    IssueType,
    getIssueWeights,
    setIssueWeights,
    resetWeightsToDefaults
} from '@/utils/weightedScoringUtils';

interface AdminSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weights: IssueWeights) => void;
    isDarkMode?: boolean;
}

const ISSUE_ICONS: Record<IssueType, string> = {
    'Road': '🛣️',
    'Footpath': '🚶',
    'Electricity': '⚡',
    'Garbage/sewage': '🗑️',
    'Stray animals': '🐕'
};

const ISSUE_COLORS: Record<IssueType, string> = {
    'Road': 'from-red-500 to-red-600',
    'Footpath': 'from-blue-500 to-blue-600',
    'Electricity': 'from-yellow-500 to-yellow-600',
    'Garbage/sewage': 'from-orange-500 to-orange-600',
    'Stray animals': 'from-purple-500 to-purple-600'
};

export default function AdminSettingsModal({
    isOpen,
    onClose,
    onSave,
    isDarkMode = false
}: AdminSettingsModalProps) {
    const [weights, setWeights] = useState<IssueWeights>(getIssueWeights());
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setWeights(getIssueWeights());
            setHasChanges(false);
        }
    }, [isOpen]);

    const handleWeightChange = (issueType: IssueType, value: number) => {
        setWeights(prev => ({
            ...prev,
            [issueType]: value
        }));
        setHasChanges(true);
    };

    const handleReset = () => {
        resetWeightsToDefaults();
        setWeights(getIssueWeights());
        setHasChanges(true);
    };

    const handleSave = () => {
        setIssueWeights(weights);
        onSave(weights);
        setHasChanges(false);
        onClose();
    };

    const handleCancel = () => {
        setWeights(getIssueWeights());
        setHasChanges(false);
        onClose();
    };

    if (!isOpen) return null;

    const issueTypes = Object.keys(weights) as IssueType[];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`
                        ${isDarkMode ? 'bg-[#13141a] border-gray-800' : 'bg-white border-gray-200'}
                        border rounded-2xl shadow-2xl max-w-2xl w-full pointer-events-auto
                        transform transition-all
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`
                        p-6 border-b
                        ${isDarkMode ? 'border-gray-800 bg-gradient-to-r from-purple-900/20 to-transparent' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-transparent'}
                    `}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Priority Weight Settings
                                    </h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Adjust the priority level for each issue type (1-10)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className={`
                                    p-2 rounded-lg transition-colors
                                    ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
                                `}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {issueTypes.map((issueType) => (
                            <div key={issueType} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{ISSUE_ICONS[issueType]}</span>
                                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {issueType}
                                        </span>
                                    </div>
                                    <div className={`
                                        px-3 py-1 rounded-lg font-bold text-lg
                                        ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}
                                    `}>
                                        {weights[issueType]}
                                    </div>
                                </div>

                                {/* Slider */}
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={weights[issueType]}
                                        onChange={(e) => handleWeightChange(issueType, parseInt(e.target.value))}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, 
                                                rgb(147, 51, 234) 0%, 
                                                rgb(147, 51, 234) ${((weights[issueType] - 1) / 9) * 100}%, 
                                                ${isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'} ${((weights[issueType] - 1) / 9) * 100}%, 
                                                ${isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'} 100%
                                            )`
                                        }}
                                    />
                                    {/* Tick marks */}
                                    <div className="flex justify-between mt-1 px-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <span
                                                key={num}
                                                className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                                            >
                                                {num}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Info Box */}
                        <div className={`
                            p-4 rounded-xl border
                            ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}
                        `}>
                            <div className="flex gap-3">
                                <svg className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm">
                                    <p className={`font-semibold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                        How it works
                                    </p>
                                    <p className={isDarkMode ? 'text-blue-300' : 'text-blue-600'}>
                                        Higher weights (8-10) indicate critical issues that need immediate attention.
                                        Lower weights (1-3) are for less urgent matters. Ward scores are calculated as:
                                        (issue count × weight) summed across all types.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`
                        p-6 border-t flex items-center justify-between
                        ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}
                    `}>
                        <button
                            onClick={handleReset}
                            className={`
                                px-4 py-2 rounded-lg font-medium transition-all
                                ${isDarkMode
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }
                            `}
                        >
                            Reset to Defaults
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className={`
                                    px-5 py-2 rounded-lg font-medium transition-all
                                    ${isDarkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }
                                `}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={`
                                    px-5 py-2 rounded-lg font-semibold transition-all
                                    ${hasChanges
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/30'
                                        : isDarkMode
                                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                                `}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom slider styles */}
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgb(147, 51, 234), rgb(126, 34, 206));
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
                    border: 3px solid white;
                }

                .slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgb(147, 51, 234), rgb(126, 34, 206));
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
                    border: 3px solid white;
                }
            `}</style>
        </>
    );
}
