using System.Text.Json;
using GuEmLaAI.BusinessObjects.ResponseModels.Weather;

namespace GuEmLaAI.Services
{
    public class AccuWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string BaseUrl = "http://dataservice.accuweather.com";

        public AccuWeatherService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["AccuWeather:ApiKey"]
                ?? throw new ArgumentNullException("AccuWeather API key is not configured");

            _httpClient.BaseAddress = new Uri(BaseUrl);
        }

        /// <summary>
        /// Get location key by GPS coordinates (latitude, longitude)
        /// </summary>
        public async Task<(string? locationKey, string? cityName)> GetLocationByCoordinatesAsync(double latitude, double longitude)
        {
            try
            {
                var url = $"/locations/v1/cities/geoposition/search?apikey={_apiKey}&q={latitude},{longitude}";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"AccuWeather API error: {error}");
                    return (null, null);
                }

                var json = await response.Content.ReadAsStringAsync();
                var location = JsonSerializer.Deserialize<LocationResponse>(json);

                if (location == null) return (null, null);

                return (location.Key, location.LocalizedName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting location by coordinates: {ex.Message}");
                return (null, null);
            }
        }

        /// <summary>
        /// Get current weather by GPS coordinates
        /// </summary>
        public async Task<WeatherResponse?> GetCurrentWeatherByCoordinatesAsync(double latitude, double longitude)
        {
            var (locationKey, cityName) = await GetLocationByCoordinatesAsync(latitude, longitude);

            if (string.IsNullOrEmpty(locationKey) || string.IsNullOrEmpty(cityName))
                return null;

            return await GetCurrentWeatherAsync(locationKey, cityName);
        }

        /// <summary>
        /// Get current weather conditions for a location
        /// </summary>
        public async Task<WeatherResponse?> GetCurrentWeatherAsync(string locationKey, string locationName)
        {
            try
            {
                var url = $"/currentconditions/v1/{locationKey}?apikey={_apiKey}&details=true";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"AccuWeather API error: {error}");
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                var conditions = JsonSerializer.Deserialize<List<CurrentConditionsResponse>>(json);
                var current = conditions?.FirstOrDefault();

                if (current == null) return null;

                return new WeatherResponse
                {
                    LocationName = locationName,
                    Temperature = current.Temperature.Metric.Value,
                    TemperatureUnit = current.Temperature.Metric.Unit,
                    WeatherText = current.WeatherText,
                    WeatherIcon = current.WeatherIcon,
                    HasPrecipitation = current.HasPrecipitation,
                    PrecipitationType = current.PrecipitationType,
                    IsDayTime = current.IsDayTime,
                    RelativeHumidity = current.RelativeHumidity,
                    WindSpeed = current.Wind.Speed.Metric.Value,
                    WindDirection = current.Wind.Direction.English,
                    UVIndex = current.UVIndex,
                    UVIndexText = current.UVIndexText
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting current weather: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Get 5-day weather forecast by GPS coordinates
        /// </summary>
        public async Task<ForecastResponse?> GetFiveDayForecastByCoordinatesAsync(double latitude, double longitude)
        {
            var (locationKey, cityName) = await GetLocationByCoordinatesAsync(latitude, longitude);

            if (string.IsNullOrEmpty(locationKey) || string.IsNullOrEmpty(cityName))
                return null;

            return await GetFiveDayForecastAsync(locationKey, cityName);
        }

        /// <summary>
        /// Get 5-day weather forecast
        /// </summary>
        public async Task<ForecastResponse?> GetFiveDayForecastAsync(string locationKey, string locationName)
        {
            try
            {
                var url = $"/forecasts/v1/daily/5day/{locationKey}?apikey={_apiKey}&metric=true";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"AccuWeather API error: {error}");
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                var forecast = JsonSerializer.Deserialize<FiveDayForecastResponse>(json);

                if (forecast == null) return null;

                return new ForecastResponse
                {
                    LocationName = locationName,
                    DailyForecasts = forecast.DailyForecasts.Select(df => new DailyForecast
                    {
                        Date = df.Date,
                        MinTemperature = df.Temperature.Minimum.Value,
                        MaxTemperature = df.Temperature.Maximum.Value,
                        TemperatureUnit = df.Temperature.Minimum.Unit,
                        Day = new DayNightForecast
                        {
                            Icon = df.Day.Icon,
                            IconPhrase = df.Day.IconPhrase,
                            HasPrecipitation = df.Day.HasPrecipitation,
                            PrecipitationType = df.Day.PrecipitationType,
                            PrecipitationIntensity = ParsePrecipitationIntensity(df.Day.PrecipitationIntensity)
                        },
                        Night = new DayNightForecast
                        {
                            Icon = df.Night.Icon,
                            IconPhrase = df.Night.IconPhrase,
                            HasPrecipitation = df.Night.HasPrecipitation,
                            PrecipitationType = df.Night.PrecipitationType,
                            PrecipitationIntensity = ParsePrecipitationIntensity(df.Night.PrecipitationIntensity)
                        }
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting forecast: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Map weather data to season recommendation
        /// </summary>
        public string GetSeasonRecommendation(WeatherResponse weather)
        {
            var temp = weather.Temperature;

            // Temperature-based season mapping
            if (temp < 15) return "Winter";
            if (temp < 20) return "Fall";
            if (temp < 28) return "Spring";
            return "Summer";
        }

        private int ParsePrecipitationIntensity(string? intensity)
        {
            return intensity?.ToLower() switch
            {
                "light" => 1,
                "moderate" => 2,
                "heavy" => 3,
                _ => 0
            };
        }
    }
}