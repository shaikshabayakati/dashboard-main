import VizagNavbar from '@/components/VizagNavbar';

export default function VizagLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <VizagNavbar />
            <main>
                {children}
            </main>
        </div>
    );
}
