namespace GuEmLaAI.BusinessObjects.ResponseModels.Outfit
{
    public class OutfitSuggestionResponse
    {
        public WeatherContext WeatherContext { get; set; } = new();
        public List<SuggestedOutfit> SuggestedOutfits { get; set; } = new();
        public string RecommendationReason { get; set; } = string.Empty;
    }

    public class WeatherContext
    {
        public string LocationName { get; set; } = string.Empty;
        public double Temperature { get; set; }
        public string TemperatureUnit { get; set; } = "C";
        public string WeatherText { get; set; } = string.Empty;
        public string SeasonRecommendation { get; set; } = string.Empty;
        public bool HasPrecipitation { get; set; }
        public string? PrecipitationType { get; set; }
    }

    public class SuggestedOutfit
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string ImagePreviewUrl { get; set; } = string.Empty;
        public bool IsFavorite { get; set; }
        public string? Comment { get; set; }
        public List<string> Seasons { get; set; } = new();
        public string MatchReason { get; set; } = string.Empty;
    }
}