namespace GuEmLaAI.BusinessObjects.ResponseModels.User
{
    public class UserReferralResponse
    {
        public string ReferralCode { get; set; }
        public string ReferralStatus { get; set; }
        public int ReferredById { get; set; }

        public string Referrer { get; set; }

        public int ItemsCreatedCount { get; set; }
        public int OutfitsCreatedCount { get; set; }
        public int VTOUsedCount { get; set; }
        public IReadOnlyList<Referee> Referees { get; set; } = new List<Referee>();
    }

    public class Referee
    {
        public string RefereeId { get; set; }
        public string RefereeName { get; set; }
        public string RefereeStatus { get; set; }
        public string CreateDate { get; set; }  // Changed from DateTime to string for formatted output
    }
}
