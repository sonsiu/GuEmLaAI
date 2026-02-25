namespace GuEmLaAI.BusinessObjects.ResponseModels.Board
{
    public class BoardResponseModel
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? CoverImageId { get; set; }
        public string? CoverImageUrl { get; set; }
    }
}
