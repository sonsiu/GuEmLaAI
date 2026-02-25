using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class User
{
    public int Id { get; set; }

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string? DisplayName { get; set; }

    public string Email { get; set; } = null!;

    public string? ProfilePicture { get; set; }

    public DateTime? CreateDate { get; set; }

    public int? AvailableToken { get; set; }

    public string? ReferralCode { get; set; }

    public int? Role { get; set; }

    public string? Bio { get; set; }

    public double? Height { get; set; }

    public double? Weight { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? ItemUploadCount { get; set; }

    public int? OutfitUploadCount { get; set; }

    public int? VirtualTryOnUsedCount { get; set; }

    public int? ReferredById { get; set; }

    public string? ReferralStatus { get; set; }

    public string? ModelPicture { get; set; }

    public int? TodayModelPictureCreatedCount { get; set; }

    public int? TodayImageGeneratedCount { get; set; }

    public int? TodayItemGeneratedCount { get; set; }

    public int? MaxModelCreated { get; set; }

    public int? MaxImageGenerated { get; set; }

    public int? MaxItemGenerated { get; set; }

    public virtual ICollection<Board> Boards { get; set; } = new List<Board>();

    public virtual ICollection<CalendarDay> CalendarDays { get; set; } = new List<CalendarDay>();

    public virtual ICollection<Collection> Collections { get; set; } = new List<Collection>();

    public virtual ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();

    public virtual ICollection<DailyOutfitPlan> DailyOutfitPlans { get; set; } = new List<DailyOutfitPlan>();

    public virtual ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();

    public virtual ICollection<HistoryBoard> HistoryBoards { get; set; } = new List<HistoryBoard>();

    public virtual ICollection<HttpRequestLog> HttpRequestLogs { get; set; } = new List<HttpRequestLog>();

    public virtual ICollection<ImageGenerated> ImageGenerateds { get; set; } = new List<ImageGenerated>();

    public virtual ICollection<User> InverseReferredBy { get; set; } = new List<User>();

    public virtual ICollection<ItemWearCount> ItemWearCounts { get; set; } = new List<ItemWearCount>();

    public virtual ICollection<ItemWearHistory> ItemWearHistories { get; set; } = new List<ItemWearHistory>();

    public virtual ICollection<Item> Items { get; set; } = new List<Item>();

    public virtual ICollection<Model> Models { get; set; } = new List<Model>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<OutfitSuggestion> OutfitSuggestions { get; set; } = new List<OutfitSuggestion>();

    public virtual ICollection<Outfit> Outfits { get; set; } = new List<Outfit>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual User? ReferredBy { get; set; }

    public virtual ICollection<SavedCollection> SavedCollections { get; set; } = new List<SavedCollection>();

    public virtual Wardrobe? Wardrobe { get; set; }

    public virtual ICollection<WebsiteAnalytic> WebsiteAnalytics { get; set; } = new List<WebsiteAnalytic>();
}
