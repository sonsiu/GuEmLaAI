using System.Text.Json.Serialization;

namespace GuEmLaAI.BusinessObjects.ResponseModels.Weather
{
    // Location Search Response
    public class LocationResponse
    {
        [JsonPropertyName("Key")]
        public string Key { get; set; } = string.Empty;

        [JsonPropertyName("LocalizedName")]
        public string LocalizedName { get; set; } = string.Empty;

        [JsonPropertyName("Country")]
        public CountryInfo Country { get; set; } = new();

        [JsonPropertyName("AdministrativeArea")]
        public AdministrativeAreaInfo AdministrativeArea { get; set; } = new();
    }

    public class CountryInfo
    {
        [JsonPropertyName("ID")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("LocalizedName")]
        public string LocalizedName { get; set; } = string.Empty;
    }

    public class AdministrativeAreaInfo
    {
        [JsonPropertyName("ID")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("LocalizedName")]
        public string LocalizedName { get; set; } = string.Empty;
    }

    // Current Conditions Response
    public class CurrentConditionsResponse
    {
        [JsonPropertyName("LocalObservationDateTime")]
        public DateTime LocalObservationDateTime { get; set; }

        [JsonPropertyName("WeatherText")]
        public string WeatherText { get; set; } = string.Empty;

        [JsonPropertyName("WeatherIcon")]
        public int WeatherIcon { get; set; }

        [JsonPropertyName("HasPrecipitation")]
        public bool HasPrecipitation { get; set; }

        [JsonPropertyName("PrecipitationType")]
        public string? PrecipitationType { get; set; }

        [JsonPropertyName("IsDayTime")]
        public bool IsDayTime { get; set; }

        [JsonPropertyName("Temperature")]
        public TemperatureInfo Temperature { get; set; } = new();

        [JsonPropertyName("RelativeHumidity")]
        public int RelativeHumidity { get; set; }

        [JsonPropertyName("Wind")]
        public WindInfo Wind { get; set; } = new();

        [JsonPropertyName("UVIndex")]
        public int UVIndex { get; set; }

        [JsonPropertyName("UVIndexText")]
        public string UVIndexText { get; set; } = string.Empty;
    }

    public class TemperatureInfo
    {
        [JsonPropertyName("Metric")]
        public UnitValue Metric { get; set; } = new();

        [JsonPropertyName("Imperial")]
        public UnitValue Imperial { get; set; } = new();
    }

    public class UnitValue
    {
        [JsonPropertyName("Value")]
        public double Value { get; set; }

        [JsonPropertyName("Unit")]
        public string Unit { get; set; } = string.Empty;
    }

    public class WindInfo
    {
        [JsonPropertyName("Speed")]
        public SpeedInfo Speed { get; set; } = new();

        [JsonPropertyName("Direction")]
        public DirectionInfo Direction { get; set; } = new();
    }

    public class SpeedInfo
    {
        [JsonPropertyName("Metric")]
        public UnitValue Metric { get; set; } = new();

        [JsonPropertyName("Imperial")]
        public UnitValue Imperial { get; set; } = new();
    }

    public class DirectionInfo
    {
        [JsonPropertyName("Localized")]
        public string Localized { get; set; } = string.Empty;

        [JsonPropertyName("English")]
        public string English { get; set; } = string.Empty;
    }

    // 5-Day Forecast Response
    public class FiveDayForecastResponse
    {
        [JsonPropertyName("Headline")]
        public HeadlineInfo Headline { get; set; } = new();

        [JsonPropertyName("DailyForecasts")]
        public List<DailyForecastDto> DailyForecasts { get; set; } = new();
    }

    public class HeadlineInfo
    {
        [JsonPropertyName("Text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("Category")]
        public string Category { get; set; } = string.Empty;
    }

    public class DailyForecastDto
    {
        [JsonPropertyName("Date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("Temperature")]
        public TemperatureRangeInfo Temperature { get; set; } = new();

        [JsonPropertyName("Day")]
        public DayNightInfo Day { get; set; } = new();

        [JsonPropertyName("Night")]
        public DayNightInfo Night { get; set; } = new();
    }

    public class TemperatureRangeInfo
    {
        [JsonPropertyName("Minimum")]
        public UnitValue Minimum { get; set; } = new();

        [JsonPropertyName("Maximum")]
        public UnitValue Maximum { get; set; } = new();
    }

    public class DayNightInfo
    {
        [JsonPropertyName("Icon")]
        public int Icon { get; set; }

        [JsonPropertyName("IconPhrase")]
        public string IconPhrase { get; set; } = string.Empty;

        [JsonPropertyName("HasPrecipitation")]
        public bool HasPrecipitation { get; set; }

        [JsonPropertyName("PrecipitationType")]
        public string? PrecipitationType { get; set; }

        [JsonPropertyName("PrecipitationIntensity")]
        public string? PrecipitationIntensity { get; set; }
    }
}