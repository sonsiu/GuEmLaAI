using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class OutfitSuggestion
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string QueryText { get; set; } = null!;

    public string? WardrobeVersion { get; set; }

    public string? Options { get; set; }

    public string? PreviewImageUrl { get; set; }

    public string? ModelImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
