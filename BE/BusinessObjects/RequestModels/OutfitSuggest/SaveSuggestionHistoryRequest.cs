using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest;

public class SaveSuggestionHistoryRequest
{
    /// <summary>
    /// The user's original query/prompt
    /// </summary>
    [Required]
    public string QueryText { get; set; } = string.Empty;

    /// <summary>
    /// Version hash of the wardrobe when suggestion was made
    /// </summary>
    public string? WardrobeVersion { get; set; }

    /// <summary>
    /// Filename of the model image used for try-on
    /// </summary>
    public string? ModelImageUrl { get; set; }

    /// <summary>
    /// Preview image URL for the history card (typically the first generated image)
    /// </summary>
    public string? PreviewImageUrl { get; set; }

    /// <summary>
    /// The 3 styling options generated for this suggestion session.
    /// Each option contains title, description, item IDs, and generated image.
    /// </summary>
    [Required]
    public List<StylingOptionRequest> Options { get; set; } = new();

    // Legacy fields for backward compatibility - will be deprecated
    public List<int>? WardrobeItemIds { get; set; }
    public List<List<int>>? OutfitItemSets { get; set; }
    public List<string>? GeneratedImages { get; set; }
}
