"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product, MealEntry, MealIngredient } from "@/lib/types";

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"product" | "meal">("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Форма продукта
  const [formData, setFormData] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    unit: "100g",
    type: "product" as "product" | "meal",
    isFavorite: false,
    isPantry: false,
  });

  // Ингредиенты для блюд
  const [ingredientMode, setIngredientMode] = useState<
    "manual" | "ingredients"
  >("manual");
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [ingredientGrams, setIngredientGrams] = useState(0);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === "product" && p.type !== "product") return false;
      if (activeTab === "meal" && p.type !== "meal") return false;
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (activeFilter === "High Protein" && p.protein < 20) return false;
      if (activeFilter === "Favorites" && !p.isFavorite) return false;
      if (activeFilter === "Pantry Essentials" && !p.isPantry) return false;
      return true;
    });
  }, [products, activeTab, searchQuery, activeFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2200);
  };

  const handleQuickAdd = async (product: Product) => {
    const today = new Date().toISOString().slice(0, 10);
    const meal: Omit<MealEntry, "id"> = {
      date: today,
      mealType: "snack",
      productId: product.id,
      productName: product.name,
      grams: 100,
      calories: Math.round(product.calories),
      protein: Math.round(product.protein * 10) / 10,
      carbs: Math.round(product.carbs * 10) / 10,
      fat: Math.round(product.fat * 10) / 10,
      time: new Date().toTimeString().slice(0, 5),
      caloriesPer100: product.calories,
      proteinPer100: product.protein,
      carbsPer100: product.carbs,
      fatPer100: product.fat,
    };
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    });
    if (res.ok) {
      showToast(`Logged "${product.name}"`);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      loadProducts();
      showToast("Deleted");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      unit: product.unit,
      type: product.type,
      isFavorite: product.isFavorite || false,
      isPantry: product.isPantry || false,
    });
    // Если это блюдо с рецептом, загружаем ингредиенты
    if (
      product.type === "meal" &&
      product.recipe &&
      product.recipe.length > 0
    ) {
      setIngredientMode("ingredients");
      setIngredients(product.recipe);
    } else {
      setIngredientMode("manual");
      setIngredients([]);
    }
    setSelectedIngredientId("");
    setIngredientGrams(0);
    setIsAddModalOpen(true);
  };

  const addIngredient = () => {
    const product = products.find((p) => p.id === selectedIngredientId);
    if (!product || ingredientGrams <= 0) return;
    const newIng: MealIngredient = {
      productId: product.id,
      name: product.name,
      grams: ingredientGrams,
      caloriesPer100: product.calories,
      proteinPer100: product.protein,
      carbsPer100: product.carbs,
      fatPer100: product.fat,
    };
    setIngredients([...ingredients, newIng]);
    setSelectedIngredientId("");
    setIngredientGrams(0);
  };

  const updateIngredientGrams = (index: number, grams: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], grams };
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Пересчёт итогов
  const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
  const totalCalories = ingredients.reduce(
    (sum, ing) => sum + (ing.caloriesPer100 * ing.grams) / 100,
    0,
  );
  const totalProtein = ingredients.reduce(
    (sum, ing) => sum + (ing.proteinPer100 * ing.grams) / 100,
    0,
  );
  const totalCarbs = ingredients.reduce(
    (sum, ing) => sum + (ing.carbsPer100 * ing.grams) / 100,
    0,
  );
  const totalFat = ingredients.reduce(
    (sum, ing) => sum + (ing.fatPer100 * ing.grams) / 100,
    0,
  );
  const per100Calories =
    totalGrams > 0 ? Math.round((totalCalories / totalGrams) * 100) : 0;
  const per100Protein =
    totalGrams > 0
      ? Math.round((totalProtein / totalGrams) * 100 * 10) / 10
      : 0;
  const per100Carbs =
    totalGrams > 0 ? Math.round((totalCarbs / totalGrams) * 100 * 10) / 10 : 0;
  const per100Fat =
    totalGrams > 0 ? Math.round((totalFat / totalGrams) * 100 * 10) / 10 : 0;

  const handleSaveProduct = async () => {
    let payload = { ...formData } as Product;

    if (formData.type === "meal" && ingredientMode === "ingredients") {
      if (ingredients.length === 0 || totalGrams === 0) {
        alert("Add at least one ingredient with positive weight");
        return;
      }
      payload = {
        ...payload,
        calories: per100Calories,
        protein: per100Protein,
        carbs: per100Carbs,
        fat: per100Fat,
        unit: "100g",
        name: formData.name || "Custom Meal",
        recipe: ingredients,
      };
    }

    if (!payload.name) {
      alert("Name is required");
      return;
    }

    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct
      ? `/api/products?id=${editingProduct.id}`
      : "/api/products";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setIsAddModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        unit: "100g",
        type: "product",
        isFavorite: false,
        isPantry: false,
      });
      setIngredients([]);
      setIngredientMode("manual");
      loadProducts();
      showToast(editingProduct ? "Updated" : "Created");
    } else {
      alert("Failed to save");
    }
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl pt-safe">
        <div className="h-14 px-space-base max-w-layout-max-width mx-auto flex items-center justify-between">
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
            Food Database
          </h1>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-layout-max-width mx-auto px-space-base pt-14 pb-24 bg-surface flex flex-col">
        <div className="flex flex-col w-full pb-6 space-y-space-base">
          {/* Search & Create */}
          <div className="flex items-center gap-space-sm w-full">
            <div className="flex-1 flex items-center bg-surface-container-lowest px-space-md py-2.5 rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-outline text-[20px] mr-2.5">
                search
              </span>
              <input
                className="w-full bg-transparent text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none"
                placeholder="Search foods, brands, or meals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex p-1 bg-surface-container-low rounded-xl">
              <button
                onClick={() => setActiveTab("product")}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "product"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("meal")}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === "meal"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                My Meals
              </button>
            </div>
            <span className="font-label-sm text-label-sm text-outline">
              {filteredProducts.length} items
            </span>
          </div>

          {/* Create button */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: "",
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                unit: "100g",
                type: "product",
                isFavorite: false,
                isPantry: false,
              });
              setIngredientMode("manual");
              setIngredients([]);
              setIsAddModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-space-base bg-surface-container-lowest text-primary-container rounded-xl shadow-sm hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_circle
            </span>
            <span className="font-label-md text-label-md font-medium">
              Create New Food or Custom Recipe
            </span>
          </button>

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              "All",
              "Recent",
              "Favorites",
              "Frequent",
              "High Protein",
              "Pantry Essentials",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors ${
                  activeFilter === filter
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Product list */}
          <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-surface-container-low">
            {filteredProducts.length === 0 ? (
              <div className="p-space-base text-center text-outline">
                No items found
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[22px]">
                        {product.type === "meal"
                          ? "restaurant_menu"
                          : "nutrition"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                          {product.name}
                        </span>
                        {product.type === "meal" && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-[10px]">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-outline truncate mt-0.5">
                        {product.calories} kcal · {product.unit} · P{" "}
                        {product.protein}g · C {product.carbs}g · F{" "}
                        {product.fat}g
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-outline hover:text-on-surface transition-colors"
                      aria-label="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-outline hover:text-error transition-colors"
                      aria-label="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center transition-transform active:scale-90"
                      aria-label="Quick log"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 inset-x-0 mx-auto w-fit max-w-[90%] flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg z-50">
            <span className="material-symbols-outlined text-primary-fixed text-[18px]">
              check_circle
            </span>
            <span className="font-label-md text-label-md">{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Модальное окно добавления/редактирования */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              {editingProduct ? "Edit Food" : "Create New Food"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-outline-variant rounded-lg"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as "product" | "meal";
                    setFormData({ ...formData, type: newType });
                    // Сброс ингредиентов при смене типа
                    setIngredientMode("manual");
                    setIngredients([]);
                  }}
                  className="w-full p-2 border border-outline-variant rounded-lg"
                >
                  <option value="product">Product</option>
                  <option value="meal">Meal (custom)</option>
                </select>
              </div>

              {formData.type === "meal" && (
                <div className="space-y-2">
                  <label className="block font-label-sm text-outline">
                    Creation Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIngredientMode("manual")}
                      className={`px-3 py-1 rounded-lg ${
                        ingredientMode === "manual"
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container-low"
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setIngredientMode("ingredients")}
                      className={`px-3 py-1 rounded-lg ${
                        ingredientMode === "ingredients"
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container-low"
                      }`}
                    >
                      From Ingredients
                    </button>
                  </div>
                </div>
              )}

              {formData.type === "meal" && ingredientMode === "ingredients" ? (
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block font-label-sm text-outline mb-1">
                        Product
                      </label>
                      <select
                        value={selectedIngredientId}
                        onChange={(e) =>
                          setSelectedIngredientId(e.target.value)
                        }
                        className="w-full p-2 border border-outline-variant rounded-lg"
                      >
                        <option value="">Select...</option>
                        {products
                          .filter((p) => p.type === "product")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.calories} kcal/100g)
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block font-label-sm text-outline mb-1">
                        Grams
                      </label>
                      <input
                        type="number"
                        value={ingredientGrams || ""}
                        onChange={(e) =>
                          setIngredientGrams(parseFloat(e.target.value))
                        }
                        className="w-full p-2 border border-outline-variant rounded-lg"
                      />
                    </div>
                    <button
                      onClick={addIngredient}
                      className="px-3 py-2 bg-primary text-on-primary rounded-lg"
                    >
                      Add
                    </button>
                  </div>

                  {/* Список ингредиентов с возможностью редактирования граммов */}
                  <div className="border border-outline-variant rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {ingredients.length === 0 ? (
                      <p className="text-sm text-outline text-center">
                        No ingredients added
                      </p>
                    ) : (
                      ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="flex-1 truncate">{ing.name}</span>
                          <input
                            type="number"
                            value={ing.grams}
                            onChange={(e) =>
                              updateIngredientGrams(
                                idx,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20 p-1 border border-outline-variant rounded text-center"
                            min="0"
                          />
                          <span className="w-16 text-right">
                            {Math.round((ing.caloriesPer100 * ing.grams) / 100)}{" "}
                            kcal
                          </span>
                          <button
                            onClick={() => removeIngredient(idx)}
                            className="text-error"
                            aria-label="Remove ingredient"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-lg text-sm">
                    <p>Total weight: {Math.round(totalGrams)}g</p>
                    <p>
                      Per 100g: {per100Calories} kcal, P {per100Protein}g, C{" "}
                      {per100Carbs}g, F {per100Fat}g
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-outline mb-1">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        value={formData.calories ? formData.calories : ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            calories:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
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
                        value={formData.protein ? formData.protein : ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            protein:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
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
                        value={formData.carbs ? formData.carbs : ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            carbs:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
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
                        value={formData.fat ? formData.fat : ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fat:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-outline-variant rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-sm text-outline mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full p-2 border border-outline-variant rounded-lg"
                    >
                      <option value="100g">100g</option>
                      <option value="100ml">100ml</option>
                      <option value="50g slice">50g slice</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) =>
                      setFormData({ ...formData, isFavorite: e.target.checked })
                    }
                  />
                  Favorite
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPantry}
                    onChange={(e) =>
                      setFormData({ ...formData, isPantry: e.target.checked })
                    }
                  />
                  Pantry Essential
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-space-sm mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                  setIngredients([]);
                  setIngredientMode("manual");
                }}
                className="px-space-base py-2 rounded-lg text-outline hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
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
