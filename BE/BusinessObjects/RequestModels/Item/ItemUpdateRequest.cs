using Microsoft.AspNetCore.Http;

namespace GuEmLaAI.BusinessObjects.RequestModels.Item
{
    public class ItemUpdateRequest
    {
        public string? CategoryName { get; set; }
        public bool? IsFavorite { get; set; }
        public string? ItemName { get; set; }
        public string? Description { get; set; }
        public List<string>? Seasons { get; set; }
        public List<string>? Colors { get; set; }
        public List<string>? Occasions { get; set; }
        public string? Size { get; set; }
    }
}
