using GuEmLaAI.BusinessObjects.ResponseModels.Outfit;

namespace GuEmLaAI.BusinessObjects.ResponseModels.Collection
{
    public class CollectionDetailResponseModel
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageCover { get; set; }
        public string? ImageCoverUrl { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public ICollection<OutfitResponseModel> Outfits { get; set; } = new List<OutfitResponseModel>();
    }
}
