import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import type { Goals } from '@/lib/types';

export async function GET() {
  const goals = await readJson<Goals>('goals.json');
  return NextResponse.json(goals);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await writeJson('goals.json', body);
  return NextResponse.json({ success: true });
}