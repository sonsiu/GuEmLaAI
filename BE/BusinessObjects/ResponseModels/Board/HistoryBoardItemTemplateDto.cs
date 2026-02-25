namespace GuEmLaAI.BusinessObjects.ResponseModels.Board
{
    /// <summary>
    /// Represents a single item in the ItemJsonTemplate with presigned URL
    /// </summary>
    public class HistoryBoardItemTemplateDto
    {
        public int Id { get; set; }
        public string ImagePreview { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string? Name { get; set; }
        public string? CategoryCode { get; set; }
    }
}
