// Клиентское хранилище на базе @capacitor/preferences (в браузере — localStorage).
// Заменяет серверные файловые JSON-хранилища, которые не работают в статичной сборке.
import { Preferences } from '@capacitor/preferences';

const PREFIX = 'fooddiary_';

async function getItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const { value } = await Preferences.get({ key: PREFIX + key });
  return value;
}

async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key: PREFIX + key, value });
}

/** Прочитать значение из локального хранилища */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Сохранить значение в локальное хранилище */
export async function writeJson<T>(key: string, data: T): Promise<void> {
  await setItem(key, JSON.stringify(data));
}

let seeded = false;

/**
 * При первом запуске приложения загружаем стартовые данные (products/goals/meals)
 * из статических seed-файлов в локальное хранилище.
 */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const seeds: Array<{ key: string; file: string }> = [
    { key: 'products.json', file: 'seed-products.json' },
    { key: 'goals.json', file: 'seed-goals.json' },
    { key: 'meals.json', file: 'seed-meals.json' },
  ];

  for (const { key, file } of seeds) {
    const existing = await getItem(key);
    if (existing !== null) continue; // уже инициализировано пользователем
    try {
      const base = document.baseURI || '/';
      const res = await fetch(new URL(file, base).href);
      if (!res.ok) continue;
      const text = await res.text();
      // Валидируем JSON перед записью
      JSON.parse(text);
      await setItem(key, text);
    } catch (err) {
      console.error(`Failed to seed ${key}:`, err);
    }
  }
}
