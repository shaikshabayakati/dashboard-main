import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Configure fetch for Node.js environment
if (typeof global.fetch === 'undefined') {
  global.fetch = fetch;
}

export async function GET() {
  try {
    console.log('[API] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured');
    }

    const sql = neon(process.env.DATABASE_URL, {
      fetchOptions: {
        cache: 'no-store',
      },
    });

    console.log('[API] Attempting to connect to database...');
    
    // Fetch all columns from pothole_reports
    const data = await sql`SELECT * FROM pothole_reports`;

    console.log('[API] Successfully fetched', data.length, 'reports');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Error fetching reports:', error);
    console.error('[API] Error code:', error?.code);
    console.error('[API] Error cause:', error?.cause);
    console.error('[API] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error?.message,
      code: error?.code
    }, { status: 500 });
  }
} 