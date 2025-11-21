import { NextResponse } from 'next/server';
import { sampleReports } from '@/hooks/sampleReports';

export async function GET() {
  return NextResponse.json(sampleReports);
}
