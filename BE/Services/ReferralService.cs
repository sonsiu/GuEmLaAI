using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.ResponseModels.User;
using GuEmLaAI.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    public class ReferralService
    {
        private readonly GuEmLaAiContext _context;
        private readonly UserService _userService;
        private readonly NotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ReferralService(
            GuEmLaAiContext context,
            UserService userService,
            NotificationService notificationService,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _userService = userService;
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        public async Task<UserReferralResponse> GetReferralInfoAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");


            // Check if current user has completed the referral threshold
            await UpdateReferralStatusIfCompleteAsync(user);

            // Get list of referees (users who were referred by this user)
            var referees = GetReferralsForUser(user.Id);

            // Get referrer name from database if user was referred by someone
            string? referrerName = null;
            if (user.ReferredById.HasValue)
            {
                referrerName = await _context.Users
                    .Where(u => u.Id == user.ReferredById.Value)
                    .Select(u => u.DisplayName ?? u.Email)
                    .FirstOrDefaultAsync();
            }

            return new UserReferralResponse
            {
                ReferralCode = user.ReferralCode,
                ReferralStatus = user.ReferralStatus,
                ReferredById = user.ReferredById ?? 0,
                Referrer = referrerName,
                ItemsCreatedCount = user.ItemUploadCount ?? 0,
                OutfitsCreatedCount = user.OutfitUploadCount ?? 0,
                VTOUsedCount = user.VirtualTryOnUsedCount ?? 0,
                Referees = referees.AsReadOnly()
            };
        }
        public async Task<bool> ApplyReferralCodeAsync(int userId, string referralCode)
        {
            if (string.IsNullOrWhiteSpace(referralCode))
                throw new ArgumentException("Referral code cannot be empty");

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            // Check if user has already been referred
            if (user.ReferredById != null)
            {
                throw new InvalidOperationException("Referrer has already been applied to this account !");
            }

            // Find the referrer by referral code
            var referrer = await _userService.GetUserByReferralCodeAsync(referralCode);
            if (referrer == null)
                throw new ArgumentException("Invalid referral code.");

            // Check if user is trying to refer themselves
            if (referrer.Id == userId)
                throw new InvalidOperationException("Cannot apply your own referral code.");

            // Check if user apply a referral code from a user who has applied current user's referral code
            if (referrer.ReferredById == userId)
                throw new InvalidOperationException("This user has applied your referal code");

            // Check if referrer has already reached the maximum referees limit (10)
            var currentRefereeCount = await GetRefereeCountAsync(referrer.Id);
            if (currentRefereeCount >= 10)
                throw new InvalidOperationException("This referral code has reached its maximum usage limit (10 users).");

            // Apply the referral
            user.ReferredById = referrer.Id;
            user.ReferralStatus = ReferralStatus.Pending.ToString();

           

            await _context.SaveChangesAsync();
            await CheckAndCompleteReferralAsync(userId);

            return true;
        }

        public async Task<bool> CheckAndCompleteReferralAsync(int userId)
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            if (user.ReferredById == null)
                throw new InvalidOperationException("User was not referred by anyone.");

            if (user.ReferralStatus == ReferralStatus.Completed.ToString())
                return false;

            bool hasCompletedThreshold = await VerifyReferralThresholdAsync(user);

            if (hasCompletedThreshold)
            {
                user.ReferralStatus = ReferralStatus.Completed.ToString();
                await _context.SaveChangesAsync();

                await AwardReferralBonusAsync(user.ReferredById.Value, userId);
                await AwardThressholdBonusAsync(userId);

                return true;
            }

            return false;
        }


        public async Task<ReferralProgressDto> GetReferralProgressAsync(int userId)
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            return new ReferralProgressDto
            {
                UserId = userId,
                ReferralStatus = user.ReferralStatus ?? ReferralStatus.None.ToString(),
                ItemsCreatedCount = user.ItemUploadCount ?? 0,
                ItemsThreshold = (int)ReferralThreshold.ItemCreated,
                OutfitsCreatedCount = user.OutfitUploadCount ?? 0,
                OutfitsThreshold = (int)ReferralThreshold.OutfitCreated,
                VTOUsedCount = user.VirtualTryOnUsedCount ?? 0,
                VTOThreshold = (int)ReferralThreshold.VTOUsed,
                IsThresholdMet = await VerifyReferralThresholdAsync(user),
                RefereeCount = await GetRefereeCountAsync(userId)
            };
        }

        public async Task<ReferralRewardsDto> GetReferralRewardsAsync(int userId)
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            var completedReferees = await _context.Users
                .Where(u => u.ReferredById == userId && u.ReferralStatus == ReferralStatus.Completed.ToString())
                .CountAsync();

            var pendingReferees = await _context.Users
                .Where(u => u.ReferredById == userId && u.ReferralStatus == ReferralStatus.Pending.ToString())
                .CountAsync();

           // var totalRewardsEarned = completedReferees * ReferralRewardCredits;

            return new ReferralRewardsDto
            {
                UserId = userId,
                CompletedReferees = completedReferees,
                PendingReferees = pendingReferees
               // TotalRewardsEarned = totalRewardsEarned,
               // RewardPerReferral = ReferralRewardCredits
            };
        }

        private async Task<bool> VerifyReferralThresholdAsync(User user)
        {
            // User must be referred by someone
            if (user.ReferredById == null)
                return false;

            bool itemThresholdMet = (user.ItemUploadCount ?? 0) >= (int)ReferralThreshold.ItemCreated;
            bool outfitThresholdMet = (user.OutfitUploadCount ?? 0) >= (int)ReferralThreshold.OutfitCreated;
            bool vtoThresholdMet = (user.VirtualTryOnUsedCount ?? 0) >= (int)ReferralThreshold.VTOUsed;

            return itemThresholdMet && outfitThresholdMet && vtoThresholdMet;
        }
        private async Task UpdateReferralStatusIfCompleteAsync(User user)
        {
            if (user.ReferredById == null)
                return;

            if (user.ReferralStatus == ReferralStatus.Completed.ToString())
                return;

            bool hasCompletedThreshold = await VerifyReferralThresholdAsync(user);

            if (hasCompletedThreshold)
            {
                user.ReferralStatus = ReferralStatus.Completed.ToString();
                await _context.SaveChangesAsync();
                await AwardReferralBonusAsync(user.ReferredById.Value, user.Id);
                await AwardThressholdBonusAsync(user.Id);
            }
        }

        private List<Referee> GetReferralsForUser(int userId)
        {
            return _context.Users
                .Where(u => u.ReferredById == userId)
                .Select(u => new Referee
                {
                    RefereeId = u.Id.ToString(),
                    RefereeName = u.DisplayName ?? u.Email,
                    RefereeStatus = u.ReferralStatus ?? "None",
                    CreateDate = (u.CreateDate ?? DateTime.MinValue).ToString("dd/MM/yyyy")
                })
                .ToList();
        }


        private async Task<int> GetRefereeCountAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.ReferredById == userId)
                .CountAsync();
        }

        private async Task AwardReferralBonusAsync(int referrerId, int refereeId)
        {
            var referrer = await _userService.GetUserByIdAsync(referrerId);

            referrer.MaxModelCreated = (referrer.MaxModelCreated ?? 0) + 1;
            referrer.MaxImageGenerated = (referrer.MaxImageGenerated ?? 0) + 1;
            referrer.MaxItemGenerated = (referrer.MaxItemGenerated ?? 0) + 1;

            await _context.SaveChangesAsync();

            var referee = await _userService.GetUserByIdAsync(refereeId);
            var refereeName = referee?.DisplayName ?? referee?.Email ?? $"User {refereeId}";
            
            //await _notificationService.SendReferralNotificationAsync(
            //    referrerId,
            //    refereeName
            //);

            await _notificationService.SendReferrerCompletedNotificationAsync(referrerId, refereeName);

            await _hubContext.Clients.Group($"user_{referrerId}")
                  .SendAsync("ReceiveDailyLimitCountUpdate", new
                  {
                      maxImageGenerated = referrer?.MaxImageGenerated ?? 0,
                      maxModelGenerated = referrer?.MaxModelCreated ?? 0,
                      maxItemGenerated = referrer?.MaxItemGenerated ?? 0,
                      timestamp = DateTime.UtcNow
                  });
        }

        private async Task AwardThressholdBonusAsync(int refereeId)
        {
            var referee = await _userService.GetUserByIdAsync(refereeId);

            referee.MaxModelCreated = (referee.MaxModelCreated ?? 0) + 1;
            referee.MaxImageGenerated = (referee.MaxImageGenerated ?? 0) + 1;
            referee.MaxItemGenerated = (referee.MaxItemGenerated ?? 0) + 1;

            await _context.SaveChangesAsync();
            //await _notificationService.SendReferralNotificationAsync(
            //    refereeId
            //);

            await _notificationService.SendReferreeCompletedNotificationAsync(refereeId);

            await _hubContext.Clients.Group($"user_{refereeId}")
              .SendAsync("ReceiveDailyLimitCountUpdate", new
              {
                  maxImageGenerated = referee?.MaxImageGenerated ?? 0,
                  maxModelGenerated = referee?.MaxModelCreated ?? 0,
                  maxItemGenerated = referee?.MaxItemGenerated ?? 0,
                  timestamp = DateTime.UtcNow
              });
        }
    }

    public class ReferralProgressDto
    {
        public int UserId { get; set; }
        public string ReferralStatus { get; set; } = string.Empty;
        public int ItemsCreatedCount { get; set; }
        public int ItemsThreshold { get; set; }
        public int OutfitsCreatedCount { get; set; }
        public int OutfitsThreshold { get; set; }
        public int VTOUsedCount { get; set; }
        public int VTOThreshold { get; set; }
        public bool IsThresholdMet { get; set; }
        public int RefereeCount { get; set; }
    }
    public class ReferralRewardsDto
    {
        public int UserId { get; set; }
        public int CompletedReferees { get; set; }
        public int PendingReferees { get; set; }
        public int TotalRewardsEarned { get; set; }
        public int RewardPerReferral { get; set; }
    }
}
