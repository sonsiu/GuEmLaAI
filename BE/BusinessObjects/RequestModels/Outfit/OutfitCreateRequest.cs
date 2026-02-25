namespace GuEmLaAI.BusinessObjects.RequestModels.Outfit
{
    public class OutfitCreateRequest
    {
        public int UserId { get; set; }
        public string? Name { get; set; }
        public IFormFile? ImageFile { get; set; } //The Image Preview File
        public string JsonTemplate { get; set; } = null!;
        public bool IsPublic { get; set; }
        public bool IsFavorite { get; set; }
        public string? Comment { get; set; }
        public List<string>? Seasons { get; set; }
    }
}
