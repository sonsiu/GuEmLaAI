namespace GuEmLaAI.BusinessObjects.ResponseModels.PublicCollection
{
    public class PublicOutfitResponseModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
        public int DisplayOrder { get; set; }
        public List<string> Seasons { get; set; } = new();
        public List<PublicItemResponseModel> Items { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PublicOutfitDetailResponseModel : PublicOutfitResponseModel
    {
        public List<PublicItemResponseModel> Items { get; set; } = new();
    }

    public class PublicItemResponseModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? BuyLink { get; set; }
        public string? Color { get; set; }
        public int DisplayOrder { get; set; }
    }
}