namespace GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest
{
    public class SaveSuggsetionOutfitRequest
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string ImagePreview { get; set; } = string.Empty;
        public List<int> ItemIds { get; set; } = new();
    }
}
