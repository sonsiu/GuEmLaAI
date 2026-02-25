namespace GuEmLaAI.BusinessObjects.ResponseModels.Item
{
    public class CleanGarmentResponse
    {
        public string finalResult { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string[] colors { get; set; } = Array.Empty<string>();
        public string[] categories { get; set; } = Array.Empty<string>();
        public string[] sizes { get; set; } = Array.Empty<string>();
        public string[] seasons { get; set; } = Array.Empty<string>();
        public string[] occasions { get; set; } = Array.Empty<string>();
        public string description { get; set; } = string.Empty;
    }
}
