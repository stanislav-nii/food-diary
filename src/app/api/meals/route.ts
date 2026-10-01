import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import type { MealEntry } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const meals = await readJson<MealEntry[]>('meals.json');
  if (date) {
    return NextResponse.json(meals.filter(m => m.date === date));
  }
  return NextResponse.json(meals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const meals = await readJson<MealEntry[]>('meals.json');
  const newMeal: MealEntry = {
    ...body,
    id: `m${Date.now()}`,
  };
  meals.push(newMeal);
  await writeJson('meals.json', meals);
  return NextResponse.json(newMeal, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  let meals = await readJson<MealEntry[]>('meals.json');
  const initialLength = meals.length;
  meals = meals.filter(m => m.id !== id);
  if (meals.length === initialLength) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await writeJson('meals.json', meals);
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await request.json();
  const meals = await readJson<MealEntry[]>('meals.json');
  const index = meals.findIndex(m => m.id === id);
  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  meals[index] = { ...meals[index], ...body, id };
  await writeJson('meals.json', meals);
  return NextResponse.json(meals[index]);
}