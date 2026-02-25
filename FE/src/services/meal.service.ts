import { Get, GetAll, Post } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

export const mealService = {
  createMealPlane: (data: any) => Post('/meal-plan/create', data),
  getAllMealPlane: (params: BaseQueryRequest) => GetAll('/meal-plan/get-all', params),
  getAllFav: (params: BaseQueryRequest) => GetAll('/meal-dish/get-all', params),
  getOneMealPlane: (id: string) => Get(`/meal-plan/get-one/${id}`),
  getOneDish: (id: string) => Get(`/meal-dish/get-one/${id}`),
  toggleDishFavorite: ({ id }: { id: string }) => Post(`/meal-dish/toggle-favorite/${id}`, {})
}
