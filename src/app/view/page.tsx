'use client';

import { useState } from 'react';
import StatsView from '@/components/StatsView';
import { GeographicProvider } from '@/contexts/GeographicContext';

export default function ViewPage() {
    return (
        <GeographicProvider>
            <StatsView />
        </GeographicProvider>
    );
}
