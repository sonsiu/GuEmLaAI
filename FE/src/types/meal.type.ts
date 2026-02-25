export interface Ingredient {
  name: string
  quantity: string // luôn có đơn vị "g", ví dụ: "100g"
}

export interface MealDish {
  _id: string
  dish_name: string
  ingredients: Ingredient[]
  calories: string // số hoặc khoảng, không có đơn vị
  protein: string // số hoặc khoảng, không có đơn vị
  carb: string // số hoặc khoảng, không có đơn vị
  fat: string // số hoặc khoảng, không có đơn vị
  isFavorite?: boolean // true nếu là món yêu thích
}

export interface DailyMealPlan {
  day: number
  overview: string
  additionalAdvice: string
  breakfast?: MealDish[]
  lunch?: MealDish[]
  dinner?: MealDish[]
  snack?: MealDish[]
  totalCalories?: string
  totalProtein?: string
  totalCarb?: string
  totalFat?: string
}

export type MealPlanResponse = DailyMealPlan[]

export interface IMealPlan {
  _id: string
  name: string
  note: string
  dailyMeals: MealPlanResponse
  createdAt: string
  updatedAt: string
}
