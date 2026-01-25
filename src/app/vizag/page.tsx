'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCombinedIssues } from '@/hooks/useCombinedIssues';
import { GeneralIssue } from '@/types/GeneralIssue';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    AreaChart,
    Area,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import WardLeaderboard from '@/components/WardLeaderboard';
import {
    getScoringMode,
    getIssueWeights,
    IssueWeights
} from '@/utils/weightedScoringUtils';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import map component
const MiniMapView = dynamic(() => import('@/components/MiniMapView'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse"></div>
});

// Professional institutional color palette - warm orange/amber gradient scheme
const COLORS = {
    // Issue categories - warm orange/amber gradient (matches dashboard theme)
    'Road': '#dc2626',           // red-600
    'Footpath': '#ea580c',       // orange-600
    'Electricity': '#f59e0b',    // amber-500
    'Garbage/sewage': '#f97316', // orange-500
    'Stray animals': '#fb923c',  // orange-400

    // Severity - limited to 3 colors (high contrast, accessible)
    'high': '#c0392b',
    'medium': '#f39c12',
    'low': '#27ae60',
    'unknown': '#95a5a6'
};

export default function VizagDashboard() {
    const { issues: allIssues, isLoading, error } = useCombinedIssues();
    const [scoringMode, setScoringModeState] = useState<'statistical' | 'weighted'>('statistical');
    const [weights, setWeights] = useState<IssueWeights>(getIssueWeights());

    // Load scoring mode from localStorage on mount (read-only)
    useEffect(() => {
        setScoringModeState(getScoringMode());
        setWeights(getIssueWeights());
    }, []);

    // Reload settings when page becomes visible (e.g., returning from admin page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setScoringModeState(getScoringMode());
                setWeights(getIssueWeights());
            }
        };

        const handleFocus = () => {
            setScoringModeState(getScoringMode());
            setWeights(getIssueWeights());
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Filter: only verified reports with valid ward assignments
    const issues = useMemo(() =>
        allIssues.filter(issue =>
            issue.wardNumber &&
            issue.wardNumber > 0 &&
            issue.isAuthentic === true
        ),
        [allIssues]
    );

    // Calculate KPIs
    const kpis = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayIssues = issues.filter(i => {
            const issueDate = new Date(i.createdAt);
            issueDate.setHours(0, 0, 0, 0);
            return issueDate.getTime() === today.getTime();
        });

        // Removed: criticalIssues (all issues are now verified)

        // Calculate weekly reports (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        const weeklyReports = issues.filter(i => {
            const issueDate = new Date(i.createdAt);
            return issueDate >= weekAgo;
        }).length;

        // Get top ward
        const wardCounts = issues.reduce((acc, i) => {
            const ward = i.wardNumber!;
            acc[ward] = (acc[ward] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const topWard = Object.entries(wardCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalToday: todayIssues.length,
            topWard: topWard ? `Ward ${topWard[0]} (${topWard[1]})` : 'N/A',
            weeklyReports
        };
    }, [issues]);

    // Ward distribution data
    const wardData = useMemo(() => {
        const counts = issues.reduce((acc, i) => {
            const ward = i.wardNumber!;
            acc[ward] = (acc[ward] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(counts)
            .map(([ward, count]) => ({ ward: `Ward ${ward}`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 wards
    }, [issues]);


    // Issue category data
    const categoryData = useMemo(() => {
        const counts = issues.reduce((acc, i) => {
            const type = i.primaryIssue || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [issues]);

    // Sub-category data
    const subCategoryData = useMemo(() => {
        const byType: Record<string, Record<string, number>> = {};

        issues.forEach(i => {
            const type = i.primaryIssue || 'Unknown';
            const subCat = i.subCategory || 'None';

            if (!byType[type]) byType[type] = {};
            byType[type][subCat] = (byType[type][subCat] || 0) + 1;
        });

        return Object.entries(byType).map(([type, subs]) => ({
            type,
            ...subs
        }));
    }, [issues]);

    // Image compliance data
    const imageData = useMemo(() => [
        { name: 'With Image', value: issues.filter(i => i.imageUrl).length },
        { name: 'Without Image', value: issues.filter(i => !i.imageUrl).length }
    ], [issues]);

    // Trend data (last 7 days)
    const trendData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        return last7Days.map(date => {
            const dayIssues = issues.filter(i => {
                const issueDate = new Date(i.createdAt);
                issueDate.setHours(0, 0, 0, 0);
                return issueDate.getTime() === date.getTime();
            });

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                total: dayIssues.length
            };
        });
    }, [issues]);

    // Week-over-Week Comparison Data
    const weekComparisonData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        return days.map(date => {
            // Current week (this day)
            const thisWeekCount = issues.filter(i => {
                const issueDate = new Date(i.createdAt);
                issueDate.setHours(0, 0, 0, 0);
                return issueDate.getTime() === date.getTime();
            }).length;

            // Previous week (same day, 7 days ago)
            const prevWeekDate = new Date(date);
            prevWeekDate.setDate(prevWeekDate.getDate() - 7);
            const lastWeekCount = issues.filter(i => {
                const issueDate = new Date(i.createdAt);
                issueDate.setHours(0, 0, 0, 0);
                return issueDate.getTime() === prevWeekDate.getTime();
            }).length;

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                thisWeek: thisWeekCount,
                lastWeek: lastWeekCount
            };
        });
    }, [issues]);

    // Issue Types by Ward (Stacked Bar Chart Data)
    const issuesByWardData = useMemo(() => {
        // Get top 7 wards
        const wardCounts = issues.reduce((acc, i) => {
            const ward = i.wardNumber!;
            acc[ward] = (acc[ward] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const topWards = Object.entries(wardCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([ward]) => parseInt(ward));

        // Count issues by type for each ward
        return topWards.map(ward => {
            const wardIssues = issues.filter(i => i.wardNumber === ward);
            const byType = wardIssues.reduce((acc, i) => {
                const type = i.primaryIssue || 'Unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                ward: `Ward ${ward}`,
                Road: byType['Road'] || 0,
                Footpath: byType['Footpath'] || 0,
                Electricity: byType['Electricity'] || 0,
                'Garbage/sewage': byType['Garbage/sewage'] || 0,
                'Stray animals': byType['Stray animals'] || 0,
            };
        });
    }, [issues]);

    // Extended 14-day trend for area chart
    const extendedTrendData = useMemo(() => {
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        return last14Days.map(date => {
            const dayIssues = issues.filter(i => {
                const issueDate = new Date(i.createdAt);
                issueDate.setHours(0, 0, 0, 0);
                return issueDate.getTime() === date.getTime();
            });

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                reports: dayIssues.length
            };
        });
    }, [issues]);

    // Removed: verificationData (all issues are verified)
    const severityData = useMemo(() => {
        const counts = issues.reduce((acc, i) => {
            const s = (i.severity || 'unknown').toLowerCase();
            let key = 'unknown';
            if (s.includes('high')) key = 'high';
            else if (s.includes('medium')) key = 'medium';
            else if (s.includes('low')) key = 'low';

            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: 'High', value: counts['high'] || 0, color: COLORS.high },
            { name: 'Medium', value: counts['medium'] || 0, color: COLORS.medium },
            { name: 'Low', value: counts['low'] || 0, color: COLORS.low }
        ].filter(d => d.value > 0);
    }, [issues]);


    // Recent issues for preview
    const recentIssues = useMemo(() =>
        issues
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4),
        [issues]
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 text-xl font-bold mb-2">Error Loading Dashboard</div>
                    <div className="text-gray-600">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${inter.className} bg-slate-50 min-h-screen`}>
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Top Row: Map (2/3) + Stacked Recent/Reports (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Map Preview Card - 2/3 Width */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Map View</h2>
                            <Link
                                href="/vizag/map"
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
                            >
                                Full Map View
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="h-[500px] relative overflow-hidden">
                            <MiniMapView issues={issues} />
                        </div>
                    </div>

                    {/* Right Column: Recent Issues + Reports Stacked */}
                    <div className="space-y-8">
                        {/* Recent Issues Card */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900">Recent Issues</h2>
                                <Link
                                    href="/vizag/view"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Full List View
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="h-[220px] overflow-y-auto scrollbar-hide">
                                {recentIssues.map(issue => (
                                    <div key={issue.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                                                {issue.primaryIssue || 'Unknown'}
                                            </span>
                                            {issue.subCategory === 'Potholes' && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-600 border border-red-400/20">
                                                    Pothole
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                Ward {issue.wardNumber || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-2">{issue.address}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Issue Types Breakdown Card - Redesigned with Progress Bars */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-900 tabular-nums">{issues.length} Citizen Reports</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {categoryData.map((cat, idx) => {
                                        const percentage = Math.round((cat.value / issues.length) * 100);
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[cat.name as keyof typeof COLORS] || '#94A3B8' }}
                                                        ></div>
                                                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 tabular-nums">{cat.value} ({percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: COLORS[cat.name as keyof typeof COLORS] || '#94A3B8'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Ward Leaderboard - Z-Score Based Classification */}
                <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-gradient-to-b from-red-600 via-amber-500 to-green-600 rounded-full"></span>
                            Ward Severity Leaderboard
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${scoringMode === 'statistical'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {scoringMode === 'statistical' ? 'Z-Score Based' : 'Priority Weighted'}
                            </span>
                            <div className="group relative inline-block">
                                <svg
                                    className="w-5 h-5 text-slate-400 hover:text-teal-700 cursor-help transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {/* Tooltip */}
                                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                    {scoringMode === 'statistical' ? (
                                        <>
                                            <p className="font-semibold mb-2">What is Z-Score?</p>
                                            <p className="leading-relaxed mb-2">
                                                Z-score is a statistical measure that shows how far a ward's issue count is from the average, measured in standard deviations.
                                            </p>
                                            <ul className="space-y-1 text-xs">
                                                <li>• <strong>Z &gt; +1.0:</strong> Ward has significantly more issues than average</li>
                                                <li>• <strong>0 to +1.0:</strong> Ward has slightly more issues than average</li>
                                                <li>• <strong>Z &lt; 0:</strong> Ward has fewer issues than average</li>
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-semibold mb-2">Priority Weighted Scoring</p>
                                            <p className="leading-relaxed mb-2">
                                                Wards are scored based on admin-defined priority weights for each issue type. Score = Σ(issue_count × weight).
                                            </p>
                                            <p className="text-xs">
                                                Higher weights indicate more critical issues.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </h3>

                        {/* Admin Link */}
                        <Link
                            href="/vizag/admin"
                            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Admin Settings
                        </Link>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        {scoringMode === 'statistical'
                            ? 'Wards ranked by number of issues. Higher Z-scores indicate more issues relative to other wards.'
                            : 'Wards ranked by priority-weighted scores. Scores reflect both issue count and admin-defined priority levels.'
                        }
                    </p>

                    <WardLeaderboard
                        issues={issues}
                        isDarkMode={false}
                        maxItems={10}
                        showMetrics={scoringMode === 'statistical'}
                        scoringMode={scoringMode}
                        weights={weights}
                    />
                </div>

                {/* Remove Admin Settings Modal from main page */}


                {/* Charts Grid - Diverse Chart Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
                    {/* Ward Distribution Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-600 rounded-sm shadow-sm"></span>
                                Ward-wise Distribution
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={wardData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="ward" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 600, fill: '#64748b' }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category Donut Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 relative">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-indigo-600 rounded-sm shadow-sm"></span>
                                Issue Categories
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="h-[300px] relative">
                            {/* Central Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-4xl font-bold text-slate-800">{issues.length}</span>
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Issues</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={75}
                                        outerRadius={95}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94A3B8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Image Compliance - Storage Style */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-emerald-500 rounded-sm shadow-sm"></span>
                                Image Evidence
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="h-[300px] relative">
                            {/* Central Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-bold text-slate-800">
                                    {Math.round((issues.filter(i => i.imageUrl).length / (issues.length || 1)) * 100)}%
                                </span>
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">With Image</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={imageData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={75}
                                        outerRadius={95}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#10B981" />
                                        <Cell fill="#E2E8F0" />
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Week-over-Week Comparison - Dual Line Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-orange-500 rounded-sm shadow-sm"></span>
                                Week-over-Week Comparison
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weekComparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="thisWeek"
                                    name="This Week"
                                    stroke="#F97316"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#F97316' }}
                                    activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="lastWeek"
                                    name="Last Week"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3B82F6' }}
                                    activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Issue Types by Ward - Stacked Bar Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-purple-600 rounded-sm shadow-sm"></span>
                                Issue Types by Ward
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={issuesByWardData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="ward" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 600, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="rect" wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="Road" stackId="a" fill="#005670" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Footpath" stackId="a" fill="#007a99" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Electricity" stackId="a" fill="#0099b8" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Garbage/sewage" stackId="a" fill="#00b8d4" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Stray animals" stackId="a" fill="#33c3dc" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily Reports Trend - Area Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-cyan-500 rounded-sm shadow-sm"></span>
                                14-Day Reports Trend
                            </h3>
                            <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={extendedTrendData}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 600, fill: '#64748b' }} dy={10} interval={1} angle={-45} textAnchor="end" height={60} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area
                                    type="monotone"
                                    dataKey="reports"
                                    stroke="#06B6D4"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReports)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
