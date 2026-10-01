import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import type { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let products = await readJson<Product[]>('products.json');
  if (type) {
    products = products.filter(p => p.type === type);
  }
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const products = await readJson<Product[]>('products.json');
  const newProduct: Product = {
    ...body,
    id: `p${Date.now()}`,
    type: body.type || 'product',
    unit: body.unit || '100g',
    isFavorite: body.isFavorite ?? false,
    isPantry: body.isPantry ?? false,
  };
  products.push(newProduct);
  await writeJson('products.json', products);
  return NextResponse.json(newProduct, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  let products = await readJson<Product[]>('products.json');
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  if (products.length === initialLength) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await writeJson('products.json', products);
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await request.json();
  let products = await readJson<Product[]>('products.json');
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  products[index] = { ...products[index], ...body, id };
  await writeJson('products.json', products);
  return NextResponse.json(products[index]);
}