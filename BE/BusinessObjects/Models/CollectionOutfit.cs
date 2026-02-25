using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class CollectionOutfit
{
    public int Id { get; set; }

    public int CollectionId { get; set; }

    public int OutfitId { get; set; }

    public DateTime AddedAt { get; set; }

    public virtual Collection Collection { get; set; } = null!;

    public virtual Outfit Outfit { get; set; } = null!;
}
