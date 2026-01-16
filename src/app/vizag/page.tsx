'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGeneralIssues } from '@/hooks/useGeneralIssues';
import { GeneralIssue } from '@/types/GeneralIssue';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import map component
const MiniMapView = dynamic(() => import('@/components/MiniMapView'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse"></div>
});

const COLORS = {
    'Open Manhole': '#EF4444',
    'Sewage': '#F97316',
    'Garbage': '#EAB308',
    'Sidewalk Encroachment': '#F97316',
    'verified': '#10B981',
    'unverified': '#F59E0B',
    'safe': '#F97316',
    'unsafe': '#EF4444'
};

export default function VizagDashboard() {
    const { issues, isLoading, error } = useGeneralIssues();

    // Calculate KPIs
    const kpis = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayIssues = issues.filter(i => {
            const issueDate = new Date(i.createdAt);
            issueDate.setHours(0, 0, 0, 0);
            return issueDate.getTime() === today.getTime();
        });

        const criticalIssues = issues.filter(i => !i.isInfrastructureSafe || !i.isAuthentic);

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
            const ward = i.wardNumber || 0;
            acc[ward] = (acc[ward] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const topWard = Object.entries(wardCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            totalToday: todayIssues.length,
            critical: criticalIssues.length,
            topWard: topWard ? `Ward ${topWard[0]} (${topWard[1]})` : 'N/A',
            weeklyReports
        };
    }, [issues]);

    // Ward distribution data
    const wardData = useMemo(() => {
        const counts = issues.reduce((acc, i) => {
            const ward = i.wardNumber || 0;
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
                total: dayIssues.length,
                verified: dayIssues.filter(i => i.isAuthentic).length,
                unverified: dayIssues.filter(i => !i.isAuthentic).length
            };
        });
    }, [issues]);

    // Status data
    const verificationData = useMemo(() => [
        { name: 'Verified', value: issues.filter(i => i.isAuthentic).length },
        { name: 'Unverified', value: issues.filter(i => !i.isAuthentic).length }
    ], [issues]);

    const safetyData = useMemo(() => [
        { name: 'Safe', value: issues.filter(i => i.isInfrastructureSafe).length },
        { name: 'Safety Concern', value: issues.filter(i => !i.isInfrastructureSafe).length }
    ], [issues]);

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-start gap-3">
                        <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="384" height="21.3334" fill="#F97316" />
                            <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                            <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.86 7.19386 428.994 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.856 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.976 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.774 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.977C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 383.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347C128.021 385.347 128.042 385.347 128.062 385.347Z" fill="#F97316" />
                            <path d="M128 384V512H256L128 384Z" fill="#F97316" />
                        </svg>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Vizag Municipal Dashboard</h1>
                            <p className="text-sm text-gray-500">Analytics & Insights</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                {/* Top Row: Map + Recent Issues + Issue Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Map Preview Card - Larger */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Map View</h2>
                            <Link
                                href="/vizag/map"
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
                            >
                                Full View
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="h-[400px] relative">
                            <MiniMapView issues={issues} />
                        </div>
                    </div>

                    {/* Recent Issues Card */}
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Recent Issues</h2>
                            <Link
                                href="/vizaglistview"
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
                            >
                                Full View
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="h-[400px] overflow-y-auto">
                            {recentIssues.map(issue => (
                                <div key={issue.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                                            {issue.primaryIssue || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Ward {issue.wardNumber || 'N/A'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{issue.address}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                        {issue.isAuthentic && (
                                            <span className="text-green-600">✓ Verified</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Issue Types Breakdown Card */}
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-3 border-b border-gray-200">
                            <h2 className="text-base font-semibold text-gray-900">{issues.length} Citizen Reports</h2>
                        </div>
                        <div className="h-[400px] overflow-y-auto p-3">
                            <div className="space-y-2">
                                {categoryData.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[cat.name as keyof typeof COLORS] || '#94A3B8' }}
                                            ></div>
                                            <span className="text-sm text-gray-700">{cat.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{cat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Row - Larger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Issues Today</div>
                        <div className="mt-3 text-4xl font-bold text-gray-900">{kpis.totalToday}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weekly Reports</div>
                        <div className="mt-3 text-4xl font-bold text-purple-600">{kpis.weeklyReports}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Critical Unresolved</div>
                        <div className="mt-3 text-4xl font-bold text-red-600">{kpis.critical}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Ward</div>
                        <div className="mt-3 text-2xl font-bold text-gray-900">{kpis.topWard}</div>
                    </div>

                </div>

                {/* Charts Grid - More Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Ward Distribution Chart */}
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Ward-wise Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={wardData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="ward" type="category" width={70} style={{ fontSize: '12px' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#F97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category Donut Chart */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Categories</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => entry.name}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94A3B8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Image Compliance */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Upload Compliance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={imageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                >
                                    <Cell fill="#10B981" />
                                    <Cell fill="#F59E0B" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Trend Line Chart */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#F97316" strokeWidth={2} />
                                <Line type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} />
                                <Line type="monotone" dataKey="unverified" stroke="#F59E0B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Verification Status */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={verificationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                >
                                    <Cell fill={COLORS.verified} />
                                    <Cell fill={COLORS.unverified} />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Safety Status */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Assessment</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={safetyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                >
                                    <Cell fill={COLORS.safe} />
                                    <Cell fill={COLORS.unsafe} />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
