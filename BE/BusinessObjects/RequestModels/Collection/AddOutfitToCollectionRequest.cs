using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.Collection
{
    public class AddOutfitToCollectionRequest
    {
        [Required]
        public int OutfitId { get; set; }
    }
}
