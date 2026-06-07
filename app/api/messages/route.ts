import { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API = `${URL}/rest/v1/messages`;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

export async function GET() {
  const res = await fetch(`${API}?select=*&order=created_at.desc`, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ error: 'Load failed' }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(API, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) return NextResponse.json({ error: 'Post failed' }, { status: res.status });
  return NextResponse.json({ success: true });
}
