using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class OutfitSeason
{
    public int Id { get; set; }

    public int OutfitId { get; set; }

    public string SeasonName { get; set; } = null!;

    public virtual Outfit Outfit { get; set; } = null!;
}
