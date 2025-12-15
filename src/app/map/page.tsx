import Dashboard from '@/components/Dashboard';
import { GeographicProvider } from '@/contexts/GeographicContext';

export default function MapPage() {
    return (
        <GeographicProvider>
            <Dashboard />
        </GeographicProvider>
    );
}
