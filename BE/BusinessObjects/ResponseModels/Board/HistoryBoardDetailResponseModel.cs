namespace GuEmLaAI.BusinessObjects.ResponseModels.Board
{
    /// <summary>
    /// Extended HistoryBoard response that includes deserialized ItemJsonTemplate with presigned URLs
    /// </summary>
    public class HistoryBoardDetailResponseModel
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public ICollection<HistoryBoardItemTemplateDto> ItemsTemplate { get; set; } = new List<HistoryBoardItemTemplateDto>();
    }
}
