using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest;

/// <summary>
/// Represents a single styling option in a suggestion session (1 of 3 options).
/// </summary>
public class StylingOptionRequest
{
    /// <summary>
    /// Display title for this option (e.g., "Style Option 1", "Creative Alternative")
    /// </summary>
    [Required]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of this styling option
    /// </summary>
    [Required]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether this option uses items from user's wardrobe (true) or is a dream/creative look (false)
    /// </summary>
    public bool IsFromWardrobe { get; set; } = true;

    /// <summary>
    /// IDs of clothing items used in this outfit
    /// </summary>
    [Required]
    public List<int> ItemIds { get; set; } = new();

    /// <summary>
    /// URL/filename of the generated try-on image for this option
    /// </summary>
    public string? GeneratedImageUrl { get; set; }
}
