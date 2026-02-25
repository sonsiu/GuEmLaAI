
export interface GarmentItem {
    id: number;
    imageFilename?: string; // Stored in database: the actual filename/key
    imageUrl?: string; // Runtime only: presigned URL (generated on-demand, not stored)
    categoryName?: string; // Category of the item (from API response "CategoryName")
}

export interface Outfit {
    id: number;
    imageFilename?: string; // Stored in database: the actual filename/key
    imageUrl?: string; // Runtime only: presigned URL (generated on-demand, not stored)
    name?: string; // Name of the outfit (from API response "Name")
}

export interface Event {
    id: number;
    time: string;
    name: string;
    startDate?: string; // 'YYYY-MM-DD' format
    startTime?: string; // 'HH:mm' format
    endDate?: string;   // 'YYYY-MM-DD' format
    endTime?: string;   // 'HH:mm' format
    isAllDay?: boolean; // true if all day event
    associatedGarments?: {
        [date: string]: Array<{
            type: 'item' | 'outfit';
            id: number;
            imageFilename?: string;
            imageUrl: string;
            categoryName?: string;
            name?: string;
        }>;
    }; // Images per day (key is 'YYYY-MM-DD'), array of garments
}

export interface DayData {
    items: GarmentItem[];
    outfit: Outfit | null;
    events: Event[];
}

export interface CalendarData {
    [date: string]: DayData; // key is 'YYYY-MM-DD'
}

export interface AssociatedItem {
    id: number;
    name: string;
    imageFileName: string;
    imageUrl: string;
}

export interface OutfitDetailsData {
    id: number;
    name: string;
    imageFileName: string;
    imageUrl: string;
    associatedItems: AssociatedItem[];
    poseImages: string[];
}

export interface OutfitDetailsResponse {
    data: OutfitDetailsData;
    message: string;
}

export interface UpcomingEvent {
    date: Date;
    content: string;
    type: 'item' | 'outfit' | 'event';
}

// Weather Types
export interface DailyForecast {
    date: string;
    maxTemperature: number;
    minTemperature: number;
    weatherText: string;
    weatherIcon: number;
    hasPrecipitation: boolean;
    precipitationType?: string;
    relativeHumidity: number;
    windSpeed: number;
    uvIndex: number;
    isDayTime: boolean;
}

export interface ForecastResponse {
    locationName: string;
    dailyForecasts: DailyForecast[];
}
