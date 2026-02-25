namespace GuEmLaAI.BusinessObjects.Models
{

    public class TodayCalendarData
    {
        public int UserId { get; set; }
        /// Today's date in "yyyy-MM-dd" format
        public string DateId { get; set; } = null!;

        /// Format: { "items": [], "outfit": null, "events": [] }
        public string Json { get; set; } = null!;
    }
}
