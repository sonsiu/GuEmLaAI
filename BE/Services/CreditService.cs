using GuEmLaAI.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    public class CreditService
    {
        private readonly GuEmLaAiContext _context;
        private readonly IConfiguration _configuration;
        private readonly NotificationService _notificationService;

        public CreditService(
            GuEmLaAiContext context,
            IConfiguration configuration,
            NotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _notificationService = notificationService;
        }
        
        public int CalculateCreditsFromPayment(int paymentAmount)
        {
            // Get conversion rate from configuration, default to 5000 VND per credit (10k VND = 2 credits)
            var vndPerCredit = _configuration.GetValue<int>("CreditSystem:VndPerCredit");
            return paymentAmount / vndPerCredit;
        }

        public async Task<bool> AddCreditsAsync(int userId, int credits, string description, int? paymentId = null, string? referenceId = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update user's available tokens
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                user.AvailableToken = (user.AvailableToken ?? 0) + credits;

                // Create credit transaction record
                var creditTransaction = new CreditTransaction
                {
                    UserId = userId,
                    Amount = credits,
                    Type = "PURCHASE",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    PaymentId = paymentId, // Link to payment
                    ReferenceId = referenceId
                };

                _context.CreditTransactions.Add(creditTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ? Send notification
               // await _notificationService.SendCreditNotificationAsync(userId, credits, "PURCHASE");

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error adding credits: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UseCreditsAsync(int userId, int credits, string description, string? referenceId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Check if user has enough credits
                var user = await _context.Users.FindAsync(userId);
                if (user == null || (user.AvailableToken ?? 0) < credits)
                {
                    return false;
                }

                // Deduct credits
                user.AvailableToken = (user.AvailableToken ?? 0) - credits;

                // Create credit transaction record
                var creditTransaction = new CreditTransaction
                {
                    UserId = userId,
                    Amount = -credits, // Negative for usage
                    Type = "USAGE",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    ReferenceId = referenceId
                };

                _context.CreditTransactions.Add(creditTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ? Send notification
                //await _notificationService.SendCreditNotificationAsync(userId, credits, "USAGE");

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error using credits: {ex.Message}");
                return false;
            }
        }

        public async Task<int> GetUserCreditsAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user?.AvailableToken ?? 0;
        }
        
        public async Task<List<CreditTransaction>> GetCreditHistoryAsync(int userId, int? limit = null)
        {
            var query = _context.CreditTransactions
                .Where(ct => ct.UserId == userId)
                .OrderByDescending(ct => ct.CreatedAt)
                .AsQueryable();

            if (limit.HasValue)
            {
                query = query.Take(limit.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> RefundCreditsAsync(int userId, int credits, string description, long? paymentOrderCode = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update user's available tokens
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                user.AvailableToken = (user.AvailableToken ?? 0) + credits;

                // Create credit transaction record
                var creditTransaction = new CreditTransaction
                {
                    UserId = userId,
                    Amount = credits,
                    Type = "REFUND",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    //PaymentOrderCode = paymentOrderCode
                };

                _context.CreditTransactions.Add(creditTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ? Send notification
               // await _notificationService.SendCreditNotificationAsync(userId, credits, "REFUND");

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error refunding credits: {ex.Message}");
                return false;
            }
        }
        
        public async Task<bool> AwardBonusCreditsAsync(int userId, int credits, string description, string? referenceId = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update user's available tokens
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                user.AvailableToken = (user.AvailableToken ?? 0) + credits;

                // Create credit transaction record
                var creditTransaction = new CreditTransaction
                {
                    UserId = userId,
                    Amount = credits,
                    Type = "BONUS",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    ReferenceId = referenceId
                };

                _context.CreditTransactions.Add(creditTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ? Send notification
                //await _notificationService.SendCreditNotificationAsync(userId, credits, "BONUS");

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error awarding bonus credits: {ex.Message}");
                return false;
            }
        }
    }
}