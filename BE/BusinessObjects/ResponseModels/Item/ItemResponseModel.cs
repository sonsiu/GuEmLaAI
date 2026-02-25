using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.BusinessObjects.ResponseModels.Item
{
    public class ItemResponseModel
    {
        public int Id { get; set; }
        public string CategoryName { get; set; } = "";
        public string ImagePreview { get; set; } = "";
        public string? ImageUrl { get; set; }
        public bool IsPublic { get; set; }
        public bool IsFavorite { get; set; }
        public string? Comment { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ICollection<string> ItemSeasons { get; set; } = new List<string>();
        public ICollection<string> ItemColors { get; set; } = new List<string>();
        public ICollection<string> ItemOccasions { get; set; } = new List<string>();

        public string Size { get; set; } = "";
    }
}
