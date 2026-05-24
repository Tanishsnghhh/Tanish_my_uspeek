import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Not implemented yet' }, { status: 501 });
}