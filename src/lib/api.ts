// Локальный «API» вместо Next.js Route Handlers (/api/*), которых нет в статике.
// Все функции работают с @capacitor/preferences (см. localstore.ts).
import { readJson, writeJson } from '@/lib/localstore';
import type { MealEntry, Goals, Product } from '@/lib/types';

// ---------- Meals ----------

export async function getMeals(date?: string): Promise<MealEntry[]> {
  const meals = await readJson<MealEntry[]>('meals.json', []);
  const normalized = meals.map(normalizeMeal);
  if (date) return normalized.filter((m) => m.date === date);
  return normalized;
}

export async function addMeal(
  body: Omit<MealEntry, 'id'>
): Promise<MealEntry> {
  const meals = await readJson<MealEntry[]>('meals.json', []);
  const newMeal: MealEntry = { ...body, id: `m${Date.now()}` };
  meals.push(newMeal);
  await writeJson('meals.json', meals);
  return newMeal;
}

export async function deleteMeal(id: string): Promise<boolean> {
  let meals = await readJson<MealEntry[]>('meals.json', []);
  const initialLength = meals.length;
  meals = meals.filter((m) => m.id !== id);
  if (meals.length === initialLength) return false;
  await writeJson('meals.json', meals);
  return true;
}

export async function updateMeal(
  id: string,
  body: Partial<MealEntry>
): Promise<MealEntry | null> {
  const meals = await readJson<MealEntry[]>('meals.json', []);
  const index = meals.findIndex((m) => m.id === id);
  if (index === -1) return null;
  meals[index] = { ...meals[index], ...body, id };
  await writeJson('meals.json', meals);
  return meals[index];
}

// Старые seed-записи могли использовать поле quantity вместо grams — приводим на лету.
function normalizeMeal(m: MealEntry): MealEntry {
  if (typeof m.grams !== 'number') {
    const qty = (m as unknown as { quantity?: number }).quantity ?? 1;
    return { ...m, grams: qty * 100 };
  }
  return m;
}

// ---------- Goals ----------

export async function getGoals(): Promise<Goals> {
  return readJson<Goals>('goals.json', {
    calories: 2510,
    protein: 140,
    carbs: 330,
    fat: 70,
    water: 2.5,
  });
}

export async function saveGoals(goals: Goals): Promise<void> {
  await writeJson('goals.json', goals);
}

// ---------- Products ----------

export async function getProducts(type?: 'product' | 'meal'): Promise<Product[]> {
  const products = await readJson<Product[]>('products.json', []);
  if (type) return products.filter((p) => p.type === type);
  return products;
}

export async function addProduct(
  body: Omit<Product, 'id'>
): Promise<Product> {
  const products = await readJson<Product[]>('products.json', []);
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
  return newProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  let products = await readJson<Product[]>('products.json', []);
  const initialLength = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length === initialLength) return false;
  await writeJson('products.json', products);
  return true;
}

export async function updateProduct(
  id: string,
  body: Partial<Product>
): Promise<Product | null> {
  const products = await readJson<Product[]>('products.json', []);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...body, id };
  await writeJson('products.json', products);
  return products[index];
}
