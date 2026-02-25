namespace GuEmLaAI.BusinessObjects.RequestModels.PublicCollection
{
    public class PublicOutfitCreateRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public IFormFile? ImageFile { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public List<string>? Seasons { get; set; }
    }

    public class PublicOutfitUpdateRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public IFormFile? ImageFile { get; set; }
        public bool? IsActive { get; set; }
        public int? DisplayOrder { get; set; }
        public List<string>? Seasons { get; set; }
    }

    public class PublicItemCreateRequest
    {
        public string Name { get; set; } = null!;
        public IFormFile ImageFile { get; set; } = null!;
        public string? BuyLink { get; set; }
        public string? Color { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    public class PublicItemUpdateRequest
    {
        public string? Name { get; set; }
        public IFormFile? ImageFile { get; set; }
        public string? BuyLink { get; set; }
        public string? Color { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class SavePublicOutfitToWardrobeRequest
    {
        public int PublicOutfitId { get; set; }
        public string? CustomName { get; set; } // Optional: user can rename
    }

    public class SavePublicItemToWardrobeRequest
    {
        public int PublicItemId { get; set; }
        public string? CategoryName { get; set; } // Optional
        public List<string>? Seasons { get; set; } // Optional
    }
}