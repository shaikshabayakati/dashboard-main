'use client';

import { Suspense } from 'react';
import VizagStatsView from '@/components/VizagStatsView';

export default function VizagListViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        }>
            <VizagStatsView />
        </Suspense>
    );
}
