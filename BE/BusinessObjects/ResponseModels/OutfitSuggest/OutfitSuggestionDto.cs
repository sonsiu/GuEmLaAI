using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.ResponseModels.OutfitSuggest
{
    public class OutfitSuggestionDto
    {
        public int Id { get; set; }
        public string QueryText { get; set; } = string.Empty;
        public string? WardrobeVersion { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string? ModelImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// The styling options for this suggestion (typically 3 options).
        /// This is the new format - parsed from Options JSON.
        /// </summary>
        public List<StylingOptionDto> Options { get; set; } = new();

        // Legacy fields for backward compatibility (raw JSON strings from DB)
        public string WardrobeItemIds { get; set; } = "[]";
        public string OutfitItemSets { get; set; } = "[]";
        public string GeneratedImages { get; set; } = "[]";
        
        /// <summary>
        /// Raw Options JSON from database (for migration purposes)
        /// </summary>
        public string OptionsJson { get; set; } = "[]";
    }
}
