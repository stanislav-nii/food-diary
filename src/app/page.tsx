// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product, MealEntry, Goals } from "@/lib/types";

// ---------- Вспомогательные функции для работы с датами ----------
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardPage() {
  // Состояние данных
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<Goals>({
    calories: 2510,
    protein: 140,
    carbs: 330,
    fat: 70,
    water: 2.5,
  });
  const [products, setProducts] = useState<Product[]>([]);

  // Состояние UI
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Поля формы добавления
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [grams, setGrams] = useState<number>(0);
  const [mealType, setMealType] = useState<MealEntry["mealType"]>("breakfast");
  const [mealTime, setMealTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );

  // Поля формы целей
  const [editGoals, setEditGoals] = useState<Goals>(goals);

  // Редактирование записи
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [editGrams, setEditGrams] = useState<number>(0);

  // Поиск продукта в модальном окне
  const [productSearch, setProductSearch] = useState("");

  // Загрузка целей и продуктов при монтировании
  useEffect(() => {
    Promise.all([
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([goalsData, productsData]) => {
        setGoals(goalsData);
        setEditGoals(goalsData);
        setProducts(productsData);
      })
      .catch((err) => console.error("Failed to load initial data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Загрузка записей при изменении выбранной даты
  const loadMeals = useCallback(async (dateKey: string) => {
    try {
      const res = await fetch(`/api/meals?date=${dateKey}`);
      if (res.ok) {
        const data = await res.json();
        setMeals(data);
      }
    } catch (err) {
      console.error("Failed to load meals:", err);
    }
  }, []);

  useEffect(() => {
    const dateKey = formatDateKey(selectedDate);
    loadMeals(dateKey);
  }, [selectedDate, loadMeals]);

  // Добавление новой записи
  const handleAddMeal = async () => {
    if (!selectedProductId || grams <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const factor = grams / 100;
    const newMeal: Omit<MealEntry, "id"> = {
      date: formatDateKey(selectedDate),
      mealType,
      productId: product.id,
      productName: product.name,
      grams,
      calories: Math.round(product.calories * factor),
      protein: Math.round(product.protein * factor * 10) / 10,
      carbs: Math.round(product.carbs * factor * 10) / 10,
      fat: Math.round(product.fat * factor * 10) / 10,
      time: mealTime,
      caloriesPer100: product.calories,
      proteinPer100: product.protein,
      carbsPer100: product.carbs,
      fatPer100: product.fat,
    };

    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMeal),
    });

    if (res.ok) {
      await loadMeals(formatDateKey(selectedDate));
      setIsAddModalOpen(false);
      setGrams(0);
      setSelectedProductId("");
      setProductSearch("");
      setMealTime(new Date().toTimeString().slice(0, 5));
    } else {
      alert("Failed to add meal");
    }
  };

  // Удаление записи
  const handleDeleteMeal = async (id: string) => {
    const res = await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadMeals(formatDateKey(selectedDate));
    } else {
      alert("Failed to delete meal");
    }
  };

  // Открытие редактора записи
  const openEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setEditGrams(meal.grams);
  };

  // Сохранение изменений граммов
  const handleSaveEditMeal = async () => {
    if (!editingMeal || editGrams <= 0) return;
    const factor = editGrams / 100;
    const updatedMeal = {
      ...editingMeal,
      grams: editGrams,
      calories: Math.round(editingMeal.caloriesPer100 * factor),
      protein: Math.round(editingMeal.proteinPer100 * factor * 10) / 10,
      carbs: Math.round(editingMeal.carbsPer100 * factor * 10) / 10,
      fat: Math.round(editingMeal.fatPer100 * factor * 10) / 10,
    };

    const res = await fetch(`/api/meals?id=${editingMeal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMeal),
    });
    if (res.ok) {
      setEditingMeal(null);
      await loadMeals(formatDateKey(selectedDate));
    } else {
      alert("Failed to update meal");
    }
  };

  // Сохранение целей
  const handleSaveGoals = async () => {
    const res = await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editGoals),
    });
    if (res.ok) {
      setGoals(editGoals);
      setIsGoalsModalOpen(false);
    } else {
      alert("Failed to update goals");
    }
  };

  // Вычисление итогов за день
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
  const waterConsumed = 1.8;

  // Прогресс (в процентах, ограничиваем 100%)
  const caloriePercent = Math.min((totalCalories / goals.calories) * 100, 100);
  const proteinPercent = Math.min((totalProtein / goals.protein) * 100, 100);
  const carbsPercent = Math.min((totalCarbs / goals.carbs) * 100, 100);
  const fatPercent = Math.min((totalFat / goals.fat) * 100, 100);
  const waterPercent = Math.min((waterConsumed / goals.water) * 100, 100);

  // Генерация недели
  const weekStart = startOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Фильтрация продуктов для поиска в модальном окне
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <p className="text-outline">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Шапка */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl pt-safe">
        <div className="h-14 px-space-base max-w-layout-max-width mx-auto flex items-center justify-between">
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
            Daily Dashboard
          </h1>
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 w-full max-w-layout-max-width mx-auto px-space-base pt-14 pb-24 bg-surface flex flex-col">
        {/* 1. Приветствие и кнопка Edit Goals */}
        <div className="flex items-center justify-between py-space-sm mb-space-base">
          <div className="flex items-center gap-space-sm">
            <img
              className="w-9 h-9 rounded-full object-cover shadow-sm"
              src="https://www.xat.com/web_gear/chat/av/696.png"
              alt="User avatar"
            />
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-outline">Welcome back,</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                Stanislav
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsGoalsModalOpen(true)}
            className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-primary font-label-md text-label-md font-medium"
          >
            Edit Goals
          </button>
        </div>

        {/* 2. Календарная полоса недели */}
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm mb-space-lg">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDates.map((date, idx) => {
              const dateKey = formatDateKey(date);
              const isActive = dateKey === formatDateKey(selectedDate);
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span className="font-label-sm text-label-sm uppercase">
                    {dayNames[idx]}
                  </span>
                  <span
                    className={`font-metric-sm text-metric-sm mt-1 ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Сводка калорий */}
        <div className="px-space-xs mb-space-lg">
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline font-semibold">
              Remaining Today
            </span>
            <span className="font-label-sm text-label-sm text-primary font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">
                trending_down
              </span>
              {totalCalories <= goals.calories ? "Deficit on track" : "Over target"}
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-display text-display font-bold tracking-tight text-on-surface tabular-nums">
              {Math.max(0, goals.calories - totalCalories).toLocaleString()}
            </span>
            <span className="font-body-md text-body-md text-outline font-normal">
              kcal left
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            <span className="font-medium text-on-surface tabular-nums">
              {totalCalories}
            </span>
            <span>kcal consumed</span>
            <span className="text-outline-variant">•</span>
            <span className="font-medium text-on-surface tabular-nums">
              {goals.calories}
            </span>
            <span>kcal target</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-700 ease-out"
              style={{ width: `${caloriePercent}%` }}
            ></div>
          </div>
        </div>

        {/* 4. Макронутриенты и вода */}
        <div className="bg-surface-container-lowest rounded-xl p-space-base shadow-sm mb-space-lg">
          <div className="grid grid-cols-4 gap-space-sm">
            {/* Углеводы */}
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline font-medium">
                Carbs
              </span>
              <div className="font-body-sm text-body-sm text-on-surface font-semibold tabular-nums leading-tight mt-1">
                {totalCarbs}
                <span className="text-outline font-normal text-[11px]">
                  /{goals.carbs}g
                </span>
              </div>
              <div className="w-full h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>
            {/* Белки */}
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline font-medium">
                Protein
              </span>
              <div className="font-body-sm text-body-sm text-on-surface font-semibold tabular-nums leading-tight mt-1">
                {totalProtein}
                <span className="text-outline font-normal text-[11px]">
                  /{goals.protein}g
                </span>
              </div>
              <div className="w-full h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>
            {/* Жиры */}
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline font-medium">
                Fat
              </span>
              <div className="font-body-sm text-body-sm text-on-surface font-semibold tabular-nums leading-tight mt-1">
                {totalFat}
                <span className="text-outline font-normal text-[11px]">
                  /{goals.fat}g
                </span>
              </div>
              <div className="w-full h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
            {/* Вода */}
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline font-medium">
                Water
              </span>
              <div className="font-body-sm text-body-sm text-on-surface font-semibold tabular-nums leading-tight mt-1">
                {waterConsumed}
                <span className="text-outline font-normal text-[11px]">
                  /{goals.water}L
                </span>
              </div>
              <div className="w-full h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-secondary-fixed-dim rounded-full"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Лог приёмов пищи */}
        <div className="flex flex-col mb-space-xl">
          <div className="flex items-center justify-between mb-space-sm px-space-xs">
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                Today's Log
              </h2>
              <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded-full tabular-nums">
                {meals.length} meals
              </span>
            </div>
            <button className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors font-medium">
              Filter
            </button>
          </div>

          {/* Карточки с едой */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            {meals.length === 0 ? (
              <div className="p-space-base text-center text-outline">
                No meals logged for this day.
              </div>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => openEditMeal(meal)}
                  className="flex items-center justify-between p-space-base hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {meal.mealType === "breakfast" && "breakfast_dining"}
                        {meal.mealType === "lunch" && "lunch_dining"}
                        {meal.mealType === "dinner" && "dinner_dining"}
                        {meal.mealType === "snack" && "local_cafe"}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                        {meal.productName}
                        {meal.grams > 0 && ` · ${meal.grams}g`}
                      </span>
                      <div className="flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
                        <span>{meal.time}</span>
                        <span>•</span>
                        <span>{Math.round(meal.protein)}g protein</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm flex-shrink-0 ml-2">
                    <span className="font-body-md text-body-md text-on-surface font-semibold tabular-nums">
                      {meal.calories}{" "}
                      <span className="font-normal text-outline text-[12px]">
                        kcal
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeal(meal.id);
                      }}
                      className="text-outline hover:text-error transition-colors"
                      aria-label="Delete meal"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Плавающая кнопка быстрого добавления */}
      <div className="fixed bottom-20 right-5 z-40">
        <button
          onClick={() => setIsAddModalOpen(true)}
          aria-label="Quick Log Food"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary-container text-on-primary shadow-md active:scale-95 transition-all flex items-center justify-center group focus:outline-none"
        >
          <span className="material-symbols-outlined text-[28px] transition-transform group-hover:rotate-90 duration-300">
            add
          </span>
        </button>
      </div>

      {/* Модальное окно добавления еды */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              Add Food
            </h3>
            <div className="space-y-4">
              {/* Поиск продукта */}
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Search Food
                </label>
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                />
              </div>

              {/* Список продуктов */}
              <div className="max-h-48 overflow-y-auto border border-outline-variant rounded-lg divide-y divide-surface-container-low">
                {filteredProducts.length === 0 ? (
                  <div className="p-2 text-center text-outline text-sm">
                    No products found
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setProductSearch("");
                      }}
                      className={`w-full flex justify-between items-center p-2 hover:bg-surface-container-low transition-colors ${
                        selectedProductId === p.id ? "bg-primary-container/20" : ""
                      }`}
                    >
                      <span className="font-body-md text-on-surface truncate">
                        {p.name}
                        {p.type === "meal" && (
                          <span className="ml-1 text-xs text-secondary">(meal)</span>
                        )}
                      </span>
                      <span className="text-sm text-outline">{p.calories} kcal</span>
                    </button>
                  ))
                )}
              </div>

              {/* Выбранный продукт */}
              {selectedProductId && (
                <div className="bg-surface-container-low p-3 rounded-lg text-sm">
                  Selected: {products.find((p) => p.id === selectedProductId)?.name}
                </div>
              )}

              {/* Граммы */}
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Amount (grams)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter grams"
                  value={grams || ""}
                  onChange={(e) => setGrams(parseFloat(e.target.value))}
                  className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                />
              </div>

              {/* Тип приёма пищи */}
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Meal type
                </label>
                <select
                  value={mealType}
                  onChange={(e) =>
                    setMealType(e.target.value as MealEntry["mealType"])
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              {/* Время */}
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                />
              </div>

              {/* Предпросмотр калорий */}
              {selectedProductId && grams > 0 && (
                <div className="bg-surface-container-low p-3 rounded-lg">
                  <p className="font-body-sm text-on-surface-variant">
                    {products.find((p) => p.id === selectedProductId)?.name} ·{" "}
                    {grams}g ={" "}
                    <span className="font-semibold text-on-surface">
                      {Math.round(
                        (products.find((p) => p.id === selectedProductId)?.calories || 0) *
                          (grams / 100)
                      )}{" "}
                      kcal
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-space-sm mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-space-base py-2 rounded-lg text-outline hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeal}
                disabled={!selectedProductId || grams <= 0}
                className="px-space-base py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования записи (только граммы) */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              Edit Portion
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-body-md text-on-surface">
                  {editingMeal.productName}
                </p>
                <p className="text-sm text-outline">
                  Original: {editingMeal.grams}g, {editingMeal.calories} kcal
                </p>
              </div>
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  New grams
                </label>
                <input
                  type="number"
                  min="0"
                  value={editGrams ? editGrams : ""}
                  onChange={(e) => setEditGrams(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg text-sm">
                New calories:{" "}
                {Math.round(editingMeal.caloriesPer100 * (editGrams / 100))} kcal
              </div>
            </div>
            <div className="flex justify-end gap-space-sm mt-6">
              <button
                onClick={() => setEditingMeal(null)}
                className="px-space-base py-2 rounded-lg text-outline hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditMeal}
                disabled={editGrams <= 0}
                className="px-space-base py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно целей */}
      {isGoalsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              Edit Goals
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={editGoals.calories}
                  onChange={(e) =>
                    setEditGoals({
                      ...editGoals,
                      calories: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={editGoals.protein}
                  onChange={(e) =>
                    setEditGoals({
                      ...editGoals,
                      protein: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={editGoals.carbs}
                  onChange={(e) =>
                    setEditGoals({
                      ...editGoals,
                      carbs: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={editGoals.fat}
                  onChange={(e) =>
                    setEditGoals({
                      ...editGoals,
                      fat: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Water (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editGoals.water}
                  onChange={(e) =>
                    setEditGoals({
                      ...editGoals,
                      water: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-space-sm mt-6">
              <button
                onClick={() => setIsGoalsModalOpen(false)}
                className="px-space-base py-2 rounded-lg text-outline hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoals}
                className="px-space-base py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}