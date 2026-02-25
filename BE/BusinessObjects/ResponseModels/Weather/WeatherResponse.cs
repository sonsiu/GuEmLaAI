namespace GuEmLaAI.BusinessObjects.ResponseModels.Weather
{
    public class WeatherResponse
    {
        public string LocationName { get; set; } = string.Empty;
        public double Temperature { get; set; }
        public string TemperatureUnit { get; set; } = "C";
        public string WeatherText { get; set; } = string.Empty;
        public int WeatherIcon { get; set; }
        public bool HasPrecipitation { get; set; }
        public string? PrecipitationType { get; set; }
        public bool IsDayTime { get; set; }
        public int RelativeHumidity { get; set; }
        public double WindSpeed { get; set; }
        public string WindDirection { get; set; } = string.Empty;
        public int UVIndex { get; set; }
        public string UVIndexText { get; set; } = string.Empty;
    }

    public class ForecastResponse
    {
        public string LocationName { get; set; } = string.Empty;
        public List<DailyForecast> DailyForecasts { get; set; } = new();
    }

    public class DailyForecast
    {   
        public DateTime Date { get; set; }
        public double MinTemperature { get; set; }
        public double MaxTemperature { get; set; }
        public string TemperatureUnit { get; set; } = "C";
        public DayNightForecast Day { get; set; } = new();
        public DayNightForecast Night { get; set; } = new();
    }

    public class DayNightForecast
    {
        public int Icon { get; set; }
        public string IconPhrase { get; set; } = string.Empty;
        public bool HasPrecipitation { get; set; }
        public string? PrecipitationType { get; set; }
        public int PrecipitationIntensity { get; set; }
    }
}