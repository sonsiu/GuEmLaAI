using Microsoft.AspNetCore.Http;

namespace GuEmLaAI.BusinessObjects.RequestModels.Item
{
    public class ItemCreateRequest
    {
        public int UserId { get; set; }
        public string CategoryName { get; set; } = "";
        public IFormFile? ImageFile { get; set; }
        public bool IsFavorite { get; set; }
        public string? ItemName { get; set; }
        public string? Description { get; set; }
        public List<string>? Seasons { get; set; }
        public List<string>? Colors { get; set; }
        public string Size { get; set; } = "";
        public List<string>? Categories { get; set; }
        public List<string>? Sizes { get; set; }
        public List<string>? Occasions { get; set; }
    }
}
