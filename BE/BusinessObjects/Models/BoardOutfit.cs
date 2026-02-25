using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class BoardOutfit
{
    public int Id { get; set; }

    public int BoardId { get; set; }

    public int OutfitId { get; set; }

    public string? ImagePreview { get; set; }

    public string JsonTemplate { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public int Status { get; set; }

    public virtual Board Board { get; set; } = null!;
}
