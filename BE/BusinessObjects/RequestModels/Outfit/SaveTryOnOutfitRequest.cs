namespace GuEmLaAI.BusinessObjects.RequestModels.Outfit
{
    /// <summary>
    /// Request to save a try-on result from HistoryBoard as an Outfit
    /// </summary>
    public class SaveTryOnOutfitRequest
    {
        // Reference to the HistoryBoard entry that contains the try-on result
        //public int HistoryBoardId { get; set; }

        // Optional: custom outfit name (auto-generate if not provided)
        public string? Name { get; set; }

        // Optional: comment about the outfit
        public string? Comment { get; set; }

        // Optional: seasons (will be inferred from items if not provided)
        public List<string>? Seasons { get; set; }

        // Optional: mark as favorite
        public bool IsFavorite { get; set; } = false;

        public List<string>? modelFileName { get; set; }
        public List<int>? ClothingItemIds { get; set; }
        }
}