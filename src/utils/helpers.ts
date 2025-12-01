/**
 * Get severity color based on label from database (ML model prediction)
 * ONLY uses the label - no numeric fallback
 */
export const getSeverityColor = (label: string | null | undefined): string => {
  if (!label) return '#6b7280'; // gray for unknown
  const normalized = label.toLowerCase();
  if (normalized === 'low') return '#10b981'; // green
  if (normalized === 'medium') return '#f59e0b'; // amber
  if (normalized === 'high') return '#ef4444'; // red
  return '#6b7280'; // gray for unknown
};

/**
 * Get severity label - use the label from database directly (ML model prediction)
 * ONLY uses the label - no numeric fallback
 */
export const getSeverityLabel = (label: string | null | undefined): string => {
  if (!label) return 'Unknown';
  const normalized = label.toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'high') return 'High';
  return 'Unknown';
};

export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return time.toLocaleDateString();
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'triaged':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'fixed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Cache for storing addresses to avoid redundant API calls
const addressCache = new Map<string, string>();

export const getAddressFromCoordinates = async (
  lat: number,
  lng: number
): Promise<string> => {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  // Check cache first
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  try {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const address = data.results[0].formatted_address;
      addressCache.set(cacheKey, address);
      return address;
    } else {
      throw new Error('No results found');
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    // Return coordinates as fallback
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};
