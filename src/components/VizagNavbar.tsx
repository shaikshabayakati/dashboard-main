'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VizagNavbar() {
    const pathname = usePathname();

    // Helper function to determine if a link is active
    const isActive = (path: string) => {
        if (path === '/vizag') {
            return pathname === '/vizag';
        }
        return pathname?.startsWith(path);
    };

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 h-16 border-b border-slate-200">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/vizag" className="flex items-center gap-3 group">
                        <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform duration-200">
                            <rect width="384" height="21.3334" fill="#F97316" />
                            <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                            <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.86 7.19386 428.994 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.856 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.976 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.774 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.977C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 383.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347C128.021 385.347 128.042 385.347 128.062 385.347Z" fill="#F97316" />
                            <path d="M128 384V512H256L128 384Z" fill="#F97316" />
                        </svg>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Vizag Dashboard</h1>
                            <p className="text-sm font-medium text-slate-500">Municipal Corporation</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex items-center gap-6">
                    
                    <Link
                        href="/vizag/view"
                        className={`px-2 py-2 text-base font-semibold transition-all relative ${isActive('/vizag/view')
                            ? 'text-orange-600'
                            : 'text-slate-600 hover:text-orange-600'
                            }`}
                    >
                        List
                        {isActive('/vizag/view') && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
                        )}
                    </Link>
                    <Link
                        href="/vizag/map"
                        className={`px-2 py-2 text-base font-semibold transition-all relative ${isActive('/vizag/map')
                            ? 'text-orange-600'
                            : 'text-slate-600 hover:text-orange-600'
                            }`}
                    >
                        Map
                        {isActive('/vizag/map') && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
                        )}
                    </Link>
                    <Link
                        href="/vizag/admin"
                        className={`px-2 py-2 text-base font-semibold transition-all relative ${isActive('/vizag/admin')
                            ? 'text-orange-600'
                            : 'text-slate-600 hover:text-orange-600'
                            }`}
                    >
                        Admin
                        {isActive('/vizag/admin') && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
                        )}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
