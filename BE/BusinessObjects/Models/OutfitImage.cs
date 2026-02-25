using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class OutfitImage
{
    public int Id { get; set; }

    public int OutfitId { get; set; }

    public string ImageName { get; set; } = null!;

    public virtual Outfit Outfit { get; set; } = null!;
}
