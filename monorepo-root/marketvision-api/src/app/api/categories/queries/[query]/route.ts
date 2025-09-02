import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/settings';

// ВАЖНО: все внешние обращения идут через nginx /api/*
const BASE = `${API_CONFIG.EXTERNAL_API_BASE_URL}/api/categories/queries`;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  const { query } = await params;
  const { searchParams } = new URL(req.url);
  const categoryKey = searchParams.get('categoryKey');
  
  console.log('DELETE /api/categories/queries/[query] request received:', { query, categoryKey });
  console.log('Making request to:', `${BASE}/${encodeURIComponent(query)}?categoryKey=${encodeURIComponent(categoryKey || '')}`);
  
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(query)}?categoryKey=${encodeURIComponent(categoryKey || '')}`, {
      method: 'DELETE',
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
