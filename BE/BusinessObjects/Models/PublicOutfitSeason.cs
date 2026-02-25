using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class PublicOutfitSeason
{
    public int OutfitId { get; set; }

    public string SeasonName { get; set; } = null!;

    public virtual PublicCollectionOutfit Outfit { get; set; } = null!;
}
