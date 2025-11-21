# Pothole Reports Map Dashboard

A modern, responsive map-first dashboard that visualizes pothole reports with dynamic clustering, built with Next.js, TypeScript, Google Maps API, and Tailwind CSS.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Interactive Map with Clustering**: Uses Supercluster for high-performance marker clustering
- **Severity-Based Visualization**: Color-coded markers (green/amber/red) based on pothole severity
- **Dynamic Cluster Behavior**: Clusters merge/unmerge smoothly as you zoom
- **Detailed Report Cards**: View images, severity scores, timestamps, and descriptions
- **Advanced Filtering**: Filter by date range, severity level, and status
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Statistics**: Count, average severity, and status breakdowns
- **Custom Map Styling**: Muted palette with subtle contrast for better readability
- **Andhra Pradesh Focus**: Sample data contains real coordinates from all districts of Andhra Pradesh

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19 with TypeScript
- **Map**: Google Maps JavaScript API
- **Clustering**: Supercluster (tile-based clustering algorithm)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useMemo, useCallback)

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Maps API Key with Maps JavaScript API enabled

## Getting Started

### 1. Clone and Install

```bash
cd pothole-map-dashboard
npm install
```

### 2. Configure Google Maps API Key

**IMPORTANT: Never commit API keys to version control!**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Google Maps API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### How to Get a Google Maps API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **Credentials** and create an API key
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers (for production)
   - **API restrictions**: Maps JavaScript API

### 3. Run Development Server

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
pothole-map-dashboard/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── getDB/
│   │   │       └── route.ts        # API route for sample data
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page component
│   ├── components/
│   │   ├── ClusterMarker.tsx       # Cluster visualization component
│   │   ├── PotholeMarker.tsx       # Individual marker component
│   │   ├── ReportCard.tsx          # Report detail card
│   │   ├── ClusterListView.tsx     # List view for clustered reports
│   │   ├── Legend.tsx              # Map legend
│   │   ├── Sidebar.tsx             # Sidebar with filters and district selection
│   │   ├── ClientOnly.tsx          # Client-side only wrapper
│   │   └── MapView.tsx             # Main map component with clustering
│   ├── data/
│   │   └── districts.ts            # Andhra Pradesh districts data
│   ├── hooks/
│   │   └── usePotholeReports.ts    # Custom hook for fetching data
│   ├── types/
│   │   └── PotholeReport.ts        # TypeScript interfaces
│   └── utils/
│       └── helpers.ts              # Helper functions
├── .env.example                    # Environment variables template
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind configuration
└── package.json
```

## Data Model

Each pothole report follows this schema:

```typescript
interface PotholeReport {
  id: string;                           // Unique identifier
  lat: number;                          // Latitude
  lng: number;                          // Longitude
  severity: number;                     // 0.0 - 1.0 (or 1-10)
  timestamp: string;                    // ISO 8601 format
  images: string[];                     // Array of image URLs
  description: string;                  // Text description
  status: 'new' | 'triaged' | 'assigned' | 'fixed';
  reporter_id?: string;                 // Optional reporter ID
  reporter_phone?: string | null;       // Optional phone number
}
```

## Usage Guide

### Map Interactions

- **Zoom Out**: Markers combine into clusters showing count and average severity
- **Zoom In**: Clusters break apart into individual markers
- **Click Cluster**:
  - At lower zoom: Zooms into the cluster area
  - At max zoom: Opens a list view with all reports in the cluster
- **Click Marker**: Shows detailed report card with image and full information

### Filters

- **Date Range**: Filter reports by start and end dates
- **Severity Range**: Use sliders to set min/max severity (0.0 - 1.0)
- **Status**: Toggle checkboxes to show/hide specific statuses

### Mobile Experience

- Tap the filter icon in the header to access filters and legend
- Details slide up from the bottom on mobile devices
- Full touch support for map interactions

## Customization

### Changing Map Style

Edit the `mapOptions.styles` array in [src/components/MapView.tsx](src/components/MapView.tsx):

```typescript
const mapOptions: google.maps.MapOptions = {
  styles: [
    // Add your custom map styles here
  ]
};
```

### Adjusting Cluster Behavior

Modify Supercluster settings in [src/components/MapView.tsx](src/components/MapView.tsx):

```typescript
const supercluster = new Supercluster({
  radius: 60,      // Cluster radius in pixels
  maxZoom: 20,     // Max zoom to cluster points on
  minZoom: 0       // Min zoom to cluster points on
});
```

### Severity Color Scheme

Update colors in [tailwind.config.js](tailwind.config.js):

```javascript
colors: {
  severity: {
    low: '#10b981',    // Green
    medium: '#f59e0b', // Amber
    high: '#ef4444',   // Red
  },
}
```

## Security Best Practices

### API Key Security

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Restrict your API key**:
   - Set HTTP referrer restrictions for production domains
   - Enable only required APIs (Maps JavaScript API)
   - Monitor usage in Google Cloud Console

### Production Deployment

For production, use server-side environment variable injection:

**Vercel/Netlify**: Set `REACT_APP_GOOGLE_MAPS_API_KEY` in dashboard

**Docker**:
```dockerfile
ENV REACT_APP_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
```

**AWS/Azure**: Use secrets manager and inject during build

## Performance Optimization

### For Large Datasets (50k+ points)

The current implementation handles up to ~50k points efficiently. For larger datasets:

1. **Server-side clustering**: Pre-cluster data on the backend
2. **Vector tiles**: Use Mapbox GL JS with vector tile sources
3. **Viewport filtering**: Only load points in the current viewport
4. **Pagination**: Implement virtual scrolling in list views

### Code Splitting

The app uses React lazy loading for optimal bundle sizes. You can add more splits:

```typescript
const MapView = React.lazy(() => import('./components/MapView'));
```

## Troubleshooting

### Map Not Loading

- Check that `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `.env`
- Verify the API key has Maps JavaScript API enabled
- Check browser console for API errors
- Ensure API key restrictions allow your domain

### Clusters Not Appearing

- Verify zoom level is appropriate (clusters appear at lower zoom)
- Check that multiple reports exist in the same geographic area
- Inspect Supercluster configuration

### TypeScript Errors

```bash
npm install --save-dev @types/google.maps @types/supercluster
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Supercluster](https://github.com/mapbox/supercluster) by Mapbox
- [Tailwind CSS](https://tailwindcss.com/)
- Sample images from [Unsplash](https://unsplash.com/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review Google Maps API documentation

---

**Built with Claude Code** - Generated by [Claude](https://claude.com/claude-code)
