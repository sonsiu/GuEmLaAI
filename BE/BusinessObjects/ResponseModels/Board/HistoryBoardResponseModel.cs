namespace GuEmLaAI.BusinessObjects.ResponseModels.Board
{
    public class HistoryBoardResponseModel
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Image { get; set; } = "";
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiredAt { get; set; }
    }
}