import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/settings';

// ВАЖНО: все внешние обращения идут через nginx /api/*
const BASE = `${API_CONFIG.EXTERNAL_API_BASE_URL}/api/categories`;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  console.log('DELETE /api/categories/[key] request received:', { key });
  console.log('Making request to:', `${BASE}/${encodeURIComponent(key)}`);
  
  try {
    const res = await fetch(`${BASE}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });
    console.log('Response status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('Response data:', data);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to connect to db-api' }, { status: 500 });
  }
}
