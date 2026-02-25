using Microsoft.AspNetCore.Http;

namespace GuEmLaAI.BusinessObjects.RequestModels.Outfit
{
    public class OutfitUpdateRequest
    {
        public string? Name { get; set; }
        public IFormFile? ImageFile { get; set; }
        public string? JsonTemplate { get; set; }
        public bool? IsPublic { get; set; }
        public bool? IsFavorite { get; set; }
        public string? Comment { get; set; }
        public List<string>? Seasons { get; set; }
    }
}