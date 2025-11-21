import { NextResponse } from 'next/server';
import { District, andhraPradeshDistricts } from '@/data/districts';

export async function GET() {
  return NextResponse.json(andhraPradeshDistricts);
}
