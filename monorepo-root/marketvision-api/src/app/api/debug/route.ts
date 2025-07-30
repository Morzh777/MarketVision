import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 DEBUG:', body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('🔍 DEBUG ERROR:', error);
    return NextResponse.json({ success: false });
  }
} 