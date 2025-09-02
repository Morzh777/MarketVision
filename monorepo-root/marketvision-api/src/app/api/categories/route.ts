import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/settings';

// ВАЖНО: все внешние обращения идут через nginx /api/*
const BASE = `${API_CONFIG.EXTERNAL_API_BASE_URL}/api/categories`;

export async function GET() {
  const res = await fetch(`${BASE}`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('POST /api/categories request received:', body);
  console.log('Making request to:', BASE);
  
  try {
    const res = await fetch(`${BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to connect to db-api' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}


