import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Configure fetch for Node.js environment
if (typeof global.fetch === 'undefined') {
  global.fetch = fetch;
}

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const mandal = searchParams.get('mandal');
    const wardNumberStr = searchParams.get('wardNumber');
    const wardNumber = wardNumberStr ? parseInt(wardNumberStr, 10) : null;

    console.log('[API] Attempting to connect to database...');
    console.log('[API] Filters:', { district, mandal, wardNumber });

    // Build dynamic query based on filters using Neon's SQL template literals
    let data;

    if (!district && !mandal && wardNumber === null) {
      // No filters - return all reports (backward compatibility)
      data = await sql`SELECT * FROM pothole_reports`;
    } else if (district && mandal && wardNumber !== null) {
      // All three filters
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE district = ${district} 
        AND mandal = ${mandal} 
        AND ward_number = ${wardNumber}
      `;
    } else if (district && mandal) {
      // District and mandal
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE district = ${district} 
        AND mandal = ${mandal}
      `;
    } else if (district && wardNumber !== null) {
      // District and ward
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE district = ${district} 
        AND ward_number = ${wardNumber}
      `;
    } else if (mandal && wardNumber !== null) {
      // Mandal and ward
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE mandal = ${mandal} 
        AND ward_number = ${wardNumber}
      `;
    } else if (district) {
      // District only
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE district = ${district}
      `;
    } else if (mandal) {
      // Mandal only
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE mandal = ${mandal}
      `;
    } else if (wardNumber !== null) {
      // Ward only
      data = await sql`
        SELECT * FROM pothole_reports 
        WHERE ward_number = ${wardNumber}
      `;
    } else {
      // Fallback - no valid filters
      data = await sql`SELECT * FROM pothole_reports`;
    }

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