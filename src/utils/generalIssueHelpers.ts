// Helper functions for General Issues

import { PrimaryIssueType } from '@/types/GeneralIssue';

/**
 * Get color for issue type
 */
export function getPriorityColor(issueType: PrimaryIssueType | null): string {
    switch (issueType) {
        case 'Open Manhole':
            return '#DC2626'; // Red - High priority
        case 'Sewage':
            return '#EA580C'; // Orange-Red - High priority
        case 'Garbage':
            return '#F59E0B'; // Amber - Medium priority
        case 'Sidewalk Encroachment':
            return '#3B82F6'; // Blue - Medium priority
        case 'None':
        default:
            return '#6B7280'; // Gray - Unknown/None
    }
}

/**
 * Get human-readable label for issue type
 */
export function getPriorityLabel(issueType: PrimaryIssueType | null): string {
    if (!issueType || issueType === 'None') return 'Unknown';
    return issueType;
}

/**
 * Get icon emoji for issue type
 */
export function getIssueIcon(issueType: PrimaryIssueType | null): string {
    switch (issueType) {
        case 'Open Manhole':
            return '🕳️';
        case 'Sewage':
            return '💧';
        case 'Garbage':
            return '🗑️';
        case 'Sidewalk Encroachment':
            return '🚧';
        case 'None':
        default:
            return '❓';
    }
}

/**
 * Format timestamp to relative time
 */
export function getRelativeTime(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get short address (first part before comma)
 */
export function getShortAddress(address: string): string {
    const parts = address.split(',');
    return parts[0].trim();
}

/**
 * Get zone display name
 */
export function getZoneLabel(zone: string | null): string {
    if (!zone) return 'Unknown Zone';
    return `Zone ${zone}`;
}

/**
 * Get ward display name
 */
export function getWardLabel(wardNumber: number | null): string {
    if (!wardNumber) return 'Unknown Ward';
    return `Ward ${wardNumber}`;
}

/**
 * Transform database general issue to frontend format
 */
export function transformGeneralIssue(dbIssue: any): any {
    return {
        id: dbIssue.id,
        address: dbIssue.address,
        latitude: dbIssue.latitude,
        longitude: dbIssue.longitude,
        lat: dbIssue.latitude, // Alias for map compatibility
        lng: dbIssue.longitude, // Alias for map compatibility
        isAuthentic: dbIssue.is_authentic,
        rejectionReason: dbIssue.rejection_reason,
        isIssuePresent: dbIssue.is_issue_present,
        primaryIssue: dbIssue.primary_issue,
        subCategory: dbIssue.sub_category,
        evidence: dbIssue.evidence,
        isInfrastructureSafe: dbIssue.is_infrastructure_safe,
        userPhone: dbIssue.user_phone,
        imageUrl: dbIssue.image_url,
        createdAt: dbIssue.created_at,
        updatedAt: dbIssue.updated_at,
        wardNumber: dbIssue.ward_number,
        zone: dbIssue.zone,
        corporatorNameAddress: dbIssue.corporator_name_address,
        timestamp: dbIssue.created_at, // Use created_at as timestamp
    };
}
