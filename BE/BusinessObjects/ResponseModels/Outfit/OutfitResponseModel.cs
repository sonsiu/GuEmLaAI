using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.BusinessObjects.ResponseModels.Outfit
{
    public class OutfitResponseModel
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string ImagePreview { get; set; } = "";
        public string? ImageUrl { get; set; }
        public bool IsPublic { get; set; }
        public bool IsFavorite { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ICollection<string> OutfitSeasons { get; set; } = new List<string>();
        public string? JsonTemplate { get; set; }
        public ICollection<int> ItemIds { get; set; } = new List<int>();
        public ICollection<string> PoseImages { get; set; } = new List<string>();
        public ICollection<ItemData> ItemImages { get; set; } = new List<ItemData>();
    }

    public class ItemData
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = "";
        public string? Name { get; set; }
        public string CategoryCode { get; set; } = "";
    }
}