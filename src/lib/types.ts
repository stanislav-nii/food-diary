export interface MealIngredient {
  productId: string;
  name: string;
  grams: number;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
}

export interface Product {
  id: string;
  name: string;
  calories: number;   // на 100 г/мл
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  type: "product" | "meal";
  isFavorite?: boolean;
  isPantry?: boolean;
  recipe?: MealIngredient[]; // только для type === "meal", если создано из ингредиентов
}

export interface MealEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  productId: string;
  productName: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}