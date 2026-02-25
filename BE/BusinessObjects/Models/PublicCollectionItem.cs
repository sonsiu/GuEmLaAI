using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class PublicCollectionItem
{
    public int Id { get; set; }

    public int? OutfitId { get; set; }

    public string? Name { get; set; }

    public string ImagePreview { get; set; } = null!;

    public string? BuyLink { get; set; }

    public string? Color { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual PublicCollectionOutfit? Outfit { get; set; }
}
