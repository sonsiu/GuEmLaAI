
import { ClientApi } from './client-api.service'
import { CalendarData, OutfitDetailsResponse, ForecastResponse } from '@/types/calendar.type'

class CalendarService {
    /**
     * Fetch user's calendar data
     */
    async fetchUserCalendar(): Promise<CalendarData> {
        const response = await ClientApi.get<{ calendarJson: string | CalendarData }>('/Calendar/my-calendar-days')

        const raw = response.getRaw()
        if (!raw?.data) {
           //console.log('📅 Calendar/my-calendar-days - No data:', raw)
            return {}
        }

        const data = raw.data
        //console.log('📅 Calendar/my-calendar-days - Raw response data:', data)
       //console.log('📅 Calendar/my-calendar-days - calendarJson type:', typeof data.calendarJson)
        
        // Parse the JSON string if it's a string, otherwise return as is
        const calendarData = typeof data.calendarJson === 'string'
            ? JSON.parse(data.calendarJson)
            : data.calendarJson || {}

        //console.log('📅 Calendar/my-calendar-days - Parsed calendarData:', calendarData)
        
        // Log events count per day
        Object.keys(calendarData).forEach((dateKey) => {
            const dayData = calendarData[dateKey]
            if (dayData?.events && dayData.events.length > 0) {
              //  console.log(`📅 ${dateKey} - Events count: ${dayData.events.length}`, dayData.events)
            }
        })

        return calendarData as CalendarData
    }

    /**
     * Update user's calendar data
     */
    async updateUserCalendar(calendarData: CalendarData): Promise<CalendarData> {
        const response = await ClientApi.put<{ calendarJson: string | CalendarData }>('/Calendar/update-calendar', {
            jsonTemplate: JSON.stringify(calendarData)
        })

        const raw = response.getRaw()
        if (!raw?.data) {
            throw new Error('Failed to update calendar')
        }

        const data = raw.data
        const updatedCalendar = typeof data.calendarJson === 'string'
            ? JSON.parse(data.calendarJson)
            : data.calendarJson

        return updatedCalendar as CalendarData
    }

    /**
     * Get associated items from an outfit
     */
    async getAssociatedItemsFromOutfit(outfitId: number): Promise<OutfitDetailsResponse> {
        const response = await ClientApi.get<OutfitDetailsResponse>(
            `/Calendar/associated-items-from-outfits?outfitId=${outfitId}`
        )

        const raw = response.getRaw()
        // The API returns the response directly as data in some cases, or wrapped.
        // Based on source code: return data as OutfitDetailsResponse
        // ClientApi wraps response in IBaseResponse. 
        // Source code: const data = await response.json(); return data as OutfitDetailsResponse;
        // So if ClientApi.get returns IBaseResponse<T>, then raw.data is T.
        // If the backend returns the object directly, ClientApi normalizes it.

        // However, the source code shows:
        // export interface OutfitDetailsResponse { data: OutfitDetailsData; message: string; }
        // So the T here is OutfitDetailsResponse.

        return raw?.data as OutfitDetailsResponse
    }

    /**
     * Get forecast by location
     */
    async getForecastByLocation(latitude: number, longitude: number): Promise<ForecastResponse> {
        const response = await ClientApi.get<ForecastResponse>(
            `/Weather/forecast-location?latitude=${latitude}&longitude=${longitude}`
        )

        return response.getRaw().data
    }

    /**
     * Get user location (Browser API)
     */
    getUserLocation(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Location permission denied. Please enable location access.'))
                            break
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Location information is unavailable.'))
                            break
                        case error.TIMEOUT:
                            reject(new Error('Location request timed out.'))
                            break
                        default:
                            reject(new Error('An unknown error occurred.'))
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            )
        })
    }
}

export const calendarService = new CalendarService()
