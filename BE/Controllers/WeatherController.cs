using GuEmLaAI.BusinessObjects.ResponseModels.Weather;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GuEmLaAI.BusinessObjects.ResponseModels.Outfit;

namespace GuEmLaAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WeatherController : ControllerBase
    {
        private readonly AccuWeatherService _weatherService;
        private readonly OutfitService _outfitService;

        public WeatherController(AccuWeatherService weatherService, OutfitService outfitService)
        {
            _weatherService = weatherService;
            _outfitService = outfitService;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }
        /// <summary>
        /// Get current weather by GPS coordinates (latitude, longitude)
        /// This is the main endpoint for your location-based feature
        /// </summary>
        /// <param name="latitude">GPS latitude (e.g., 10.8231)</param>
        /// <param name="longitude">GPS longitude (e.g., 106.6297)</param>
        [HttpGet("current-location")]
        public async Task<ActionResult<object>> GetCurrentWeatherByLocation(
            [FromQuery] double latitude,
            [FromQuery] double longitude)
        {
            if (latitude < -90 || latitude > 90)
                return BadRequest(new { error = "Invalid latitude. Must be between -90 and 90." });

            if (longitude < -180 || longitude > 180)
                return BadRequest(new { error = "Invalid longitude. Must be between -180 and 180." });

            var weather = await _weatherService.GetCurrentWeatherByCoordinatesAsync(latitude, longitude);

            if (weather == null)
                return NotFound(new { error = "Weather data not found for this location" });

            // Get season recommendation based on weather
            var seasonRecommendation = _weatherService.GetSeasonRecommendation(weather);

            return Ok(new
            {
                weather,
                seasonRecommendation,
                coordinates = new { latitude, longitude }
            });
        }

        /// <summary>
        /// Get 5-day forecast by GPS coordinates
        /// </summary>
        /// <param name="latitude">GPS latitude</param>
        /// <param name="longitude">GPS longitude</param>
        [HttpGet("forecast-location")]
        public async Task<ActionResult<ForecastResponse>> GetForecastByLocation(
            [FromQuery] double latitude,
            [FromQuery] double longitude)
        {
            if (latitude < -90 || latitude > 90)
                return BadRequest(new { error = "Invalid latitude. Must be between -90 and 90." });

            if (longitude < -180 || longitude > 180)
                return BadRequest(new { error = "Invalid longitude. Must be between -180 and 180." });

            var forecast = await _weatherService.GetFiveDayForecastByCoordinatesAsync(latitude, longitude);

            if (forecast == null)
                return NotFound(new { error = "Forecast data not found for this location" });

            return Ok(forecast);
        }

        /// <summary>
        /// Get outfit suggestions based on current weather at user's location
        /// This combines weather data with user's outfits to provide recommendations
        /// </summary>
        /// <param name="latitude">GPS latitude</param>
        /// <param name="longitude">GPS longitude</param>
        [HttpGet("suggest-outfits")]
        public async Task<ActionResult<OutfitSuggestionResponse>> SuggestOutfitsByWeather(
            [FromQuery] double latitude,
            [FromQuery] double longitude)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (latitude < -90 || latitude > 90)
                return BadRequest(new { error = "Invalid latitude. Must be between -90 and 90." });

            if (longitude < -180 || longitude > 180)
                return BadRequest(new { error = "Invalid longitude. Must be between -180 and 180." });

            // Get current weather
            var weather = await _weatherService.GetCurrentWeatherByCoordinatesAsync(latitude, longitude);

            if (weather == null)
                return NotFound(new { error = "Weather data not found for this location" });

            // Get season recommendation based on weather
            var seasonRecommendation = _weatherService.GetSeasonRecommendation(weather);

            // Build outfit suggestions
            var suggestions = await _outfitService.BuildOutfitSuggestionAsync(
                userId.Value,
                weather,
                seasonRecommendation
            );

            return Ok(suggestions);
        }

    }
}