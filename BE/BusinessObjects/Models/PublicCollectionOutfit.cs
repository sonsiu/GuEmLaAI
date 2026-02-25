using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class PublicCollectionOutfit
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImagePreview { get; set; }

    public bool? IsActive { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<PublicCollectionItem> PublicCollectionItems { get; set; } = new List<PublicCollectionItem>();

    public virtual ICollection<PublicOutfitSeason> PublicOutfitSeasons { get; set; } = new List<PublicOutfitSeason>();
}
