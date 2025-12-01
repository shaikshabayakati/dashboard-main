import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Fetch all columns from pothole_reports
    const data = await sql`SELECT * FROM pothole_reports`;

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
} 