using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.Collection
{
    public class UpdateCollectionRequest
    {
        [StringLength(50, MinimumLength = 1)]
        public string? Name { get; set; }

        [StringLength(300)]
        public string? Description { get; set; }

        public IFormFile? ImageCoverFile { get; set; }

        public bool? IsPublic { get; set; }
    }
}
