import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/settings';

// через nginx
const BASE = `${API_CONFIG.EXTERNAL_API_BASE_URL}/api/categories/queries`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryKey = searchParams.get('categoryKey');
  const url = categoryKey ? `${BASE}?categoryKey=${encodeURIComponent(categoryKey)}` : BASE;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryKey = searchParams.get('categoryKey');
    const query = searchParams.get('query');
    
    console.log('=== DELETE QUERY REQUEST ===');
    console.log('Full URL:', req.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Extracted categoryKey:', categoryKey);
    console.log('Extracted query:', query);
    console.log('Making request to:', `${BASE}?categoryKey=${encodeURIComponent(categoryKey || '')}&query=${encodeURIComponent(query || '')}`);
    
    if (!categoryKey || !query) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'categoryKey and query required' }, { status: 400 });
    }
    
    const url = `${BASE}?categoryKey=${encodeURIComponent(categoryKey)}&query=${encodeURIComponent(query)}`;
    console.log('Request URL to external API:', url);
    
    const res = await fetch(url, {
      method: 'DELETE',
    });
    
    console.log('External API response status:', res.status);
    console.log('External API response headers:', Object.fromEntries(res.headers.entries()));
    
    let data;
    try {
      data = await res.json();
      console.log('External API response data:', data);
    } catch (jsonError) {
      console.log('Failed to parse JSON response:', jsonError);
      data = {};
    }
    
    console.log('=== END DELETE QUERY REQUEST ===');
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to connect to db-api', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


