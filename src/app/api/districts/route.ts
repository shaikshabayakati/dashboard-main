import { NextResponse } from 'next/server';
import { District, andhraPradeshDistricts } from '@/data/locationData';

export async function GET() {
  return NextResponse.json(andhraPradeshDistricts);
}
