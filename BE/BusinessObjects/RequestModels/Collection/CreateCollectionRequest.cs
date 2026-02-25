using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.Collection
{
    public class CreateCollectionRequest
    {
        [Required]
        [StringLength(50, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        [StringLength(300)]
        public string? Description { get; set; }

        public IFormFile? ImageCoverFile { get; set; }

        public bool IsPublic { get; set; } = false;
    }
}
