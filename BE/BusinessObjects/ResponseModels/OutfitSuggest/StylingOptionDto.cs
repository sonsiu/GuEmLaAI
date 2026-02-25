using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.ResponseModels.OutfitSuggest;

/// <summary>
/// Response DTO for a single styling option in a suggestion history entry.
/// </summary>
public class StylingOptionDto
{
    /// <summary>
    /// Display title for this option (e.g., "Style Option 1", "Creative Alternative")
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of this styling option
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether this option uses items from user's wardrobe (true) or is a dream/creative look (false)
    /// </summary>
    public bool IsFromWardrobe { get; set; } = true;

    /// <summary>
    /// IDs of clothing items used in this outfit
    /// </summary>
    public List<int> ItemIds { get; set; } = new();

    /// <summary>
    /// Full URL of the generated try-on image for this option (pre-signed)
    /// </summary>
    public string? GeneratedImageUrl { get; set; }
}
