namespace GuEmLaAI.BusinessObjects.ResponseModels.User
{
    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? DisplayName { get; set; }
        public string Email { get; set; } = null!;
        public string? ProfilePicture { get; set; }
        public string? ProfilePictureUrl { get; set; }
        //public string? ModelPicture { get; set; }
        //public string? ModelPictureUrl { get; set; }
        public string? Bio { get; set; }
        public double? Height { get; set; }
        public double? Weight { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? AvailableToken { get; set; }
        public string? ReferralCode { get; set; }
        public int? Role { get; set; }
        public List<string> modelPictureUrls { get; set; } = new List<string>();
        public string? DefaultModelPictureUrl { get; set; }
        public int TodayModelPictureCreatedCount { get; set; }
        public int TodayImageGeneratedCount { get; set; }
        public int TodayItemGeneratedCount { get; set; }
        public int MaxModelCreatePerDay { get; set; }
        public int MaxImageGeneratePerDay { get; set; }
        public int MaxItemGeneratePerDay { get; set; }

    }
}
