using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace GuEmLaAI.Services
{
    public class NotificationService
    {
        private readonly GuEmLaAiContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public NotificationService(
            GuEmLaAiContext context,
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
            
            // Configure JSON serialization to preserve Vietnamese characters
            _jsonOptions = new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                WriteIndented = false
            };
        }

        // OLD METHODS FOR STRING BASED NOTIFICATIONS
        public async Task<Notification> SendNotificationAsync(
            int? userId,
            string content,
            NotificationType type,
            NotificationCategory notifCate)
        {
            try
            {
                if (content == null)
                    throw new ArgumentNullException(nameof(content), "Notification content cannot be null");

                var notification = new Notification
                {
                    UserId = userId,
                    Type = type.ToString(),
                    Content = content,
                    IsRead = true,
                    CreatedAt = DateTime.UtcNow
                };

                // Validate user exists if not a global notification, and change the noti structure accordingly.
                // Since the global notification is for all users, it should be marked as 1 by default for sake of using the get function.
                if (userId.HasValue)
                {
                    var userExists = await _context.Users.AnyAsync(u => u.Id == userId.Value);
                    notification.IsRead = false;
                    if (!userExists)
                        throw new InvalidOperationException($"User with ID {userId} does not exist");
                }

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Created notification {notification.Id} for user {userId}");

                // Broadcast via SignalR upon creation if not global
                if (userId.HasValue)
                {
                    // User-specific notification
                    await _hubContext.Clients.Group($"user_{userId}")
                        .SendAsync("ReceiveNotification", new
                        {
                            notification.Id,
                            notification.Type,
                            notification.Content,
                            notification.IsRead,
                            notification.CreatedAt
                        });
                }

                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationService] Failed to send notification to user {userId}");
                throw;
            }
        }

        //NEW METHODS FOR JSON BASED NOTIFICATIONS
        public async Task<Notification> SendJsonNotificationAsync(
            int? userId,
            object data,
            NotificationType type,
            NotificationCategory notifCate)
        {
            try
            {
                if (data == null)
                    throw new ArgumentNullException(nameof(data), "Notification data cannot be null");

                var jsonContent = JsonSerializer.Serialize(new
                {
                    type = notifCate.ToString(),
                    data = data
                }, _jsonOptions);

                var notification = new Notification
                {
                    UserId = userId,
                    Type = type.ToString(),
                    Content = jsonContent,
                    IsRead = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (userId.HasValue)
                {
                    var userExists = await _context.Users.AnyAsync(u => u.Id == userId.Value);
                    notification.IsRead = false;
                    if (!userExists)
                        throw new InvalidOperationException($"User with ID {userId} does not exist");
                }

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                if (userId.HasValue)
                {
                    await _hubContext.Clients.Group($"user_{userId}")
                        .SendAsync("ReceiveNotification", new
                        {
                            notification.Id,
                            notification.Type,
                            notification.Content,
                            notification.IsRead,
                            notification.CreatedAt
                        });
                }

                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationService] Failed to send JSON notification to user {userId}");
                throw;
            }
        }

        public async Task SendItemCreatedNotificationAsync(int userId, string itemName)
        {
            await SendJsonNotificationAsync(
                userId,
                new { name = itemName },
                NotificationType.SYSTEM,
                NotificationCategory.ITEM_CREATED
            );
        }

        public async Task SendOutfitCreatedNotificationAsync(int userId, string outfitName)
        {
            await SendJsonNotificationAsync(
                userId,
                new { name = outfitName },
                NotificationType.SYSTEM,
                NotificationCategory.OUTFIT_CREATED
            );
        }

        public async Task SendWelcomeNotificationAsync(int userId)
        {
            await SendJsonNotificationAsync(
                userId,
                new { },
                NotificationType.SYSTEM,
                NotificationCategory.WELLCOME
            );
        }

        public async Task SendReferrerCompletedNotificationAsync(int userId, string referrerName)
        {
            await SendJsonNotificationAsync(
                userId,
                new { referrerName = referrerName },
                NotificationType.REFERRAL,
                NotificationCategory.REFERRER_COMPLETED
            );
        }

        public async Task SendReferreeCompletedNotificationAsync(int userId)
        {
            await SendJsonNotificationAsync(
                userId,
                new { },
                NotificationType.REFERRAL,
                NotificationCategory.REFERREE_COMPLETED
            );
        }

        public async Task SendCalendarReminderNotificationAsync(int userId, int garmentCount, int outfitCount, int eventCount)
        {
            await SendJsonNotificationAsync(
                userId,
                new
                {
                    garmentCount = garmentCount,
                    outfitCount = outfitCount,
                    eventCount = eventCount
                },
                NotificationType.REMINDER,
                NotificationCategory.CALENDAR_REMINDER
            );
        }

        public async Task SendGlobalNotificationAsync(string en, string vn)
        {
            await SendJsonNotificationAsync(
                null,
                new {
                    vn = vn,
                    en = en
                },
                NotificationType.SYSTEM,
                NotificationCategory.GLOBAL_NOTFICATION
            );
        }

        /// Get all notifications for a user or global notifications
        public async Task<List<Notification>> GetUserNotificationsAsync(int? userId, int limit = 50, bool unreadOnly = false)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        /// Mark a specific notification as read
        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                _logger.LogWarning($"[NotificationService] Notification {notificationId} not found for user {userId}");
                return false;
            }

            if (notification.IsRead)
            {
                return true;
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            // Notify client about the update
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("NotificationRead", new { notificationId });

            return true;
        }

        public async Task<int> MarkAllAsReadAsync(int userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!unreadNotifications.Any())
            {
                return 0;
            }

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("AllNotificationsRead");

            return unreadNotifications.Count;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId, int? userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                return false;
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[NotificationService] Deleted notification {notificationId} for user {userId}");

            return true;
        }

        public async Task<int> DeleteReadNotificationsAsync(int userId)
        {
            var readNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.IsRead)
                .ToListAsync();

            if (!readNotifications.Any())
            {
                return 0;
            }

            _context.Notifications.RemoveRange(readNotifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[NotificationService] Deleted {readNotifications.Count} read notifications for user {userId}");

            return readNotifications.Count;
        }

        //Helper methods
        //public async Task SendCreditNotificationAsync(int userId, int credits, string action)
        //{
        //    var content = action switch
        //    {
        //        "PURCHASE" => $" {credits} credits added to your account",
        //        "USAGE" => $" {credits} credits used",
        //        "BONUS" => $" You received {credits} bonus credits!",
        //        "REFUND" => $" {credits} credits refunded to your account",
        //        _ => $"Credits updated: {credits}"
        //    };

        //    //await SendNotificationAsync(userId, content, NotificationType.CREDIT, NotificationCategory.Success);
        //}

        //public async Task SendReferralNotificationAsync(int userId, string refereeName)
        //{
        //    var content = $" Your referral '{refereeName}' completed their tasks! +1 Daily Limit to your account !";
        //    await SendNotificationAsync(userId, content, NotificationType.REFERRAL, NotificationCategory.Success);
        //}

        //public async Task SendReferralNotificationAsync(int userId)
        //{
        //    var content = $" You have completed all of the Referral Tasks ! +1 Daily Limit to your account !";
        //    await SendNotificationAsync(userId, content, NotificationType.REFERRAL, NotificationCategory.Success);
        //}


        //Skip this
        public async Task SendPaymentNotificationAsync(int userId, int amount, bool success)
        {
            var content = success
                ? $" Payment of {amount} VND successful"
                : $" Payment of {amount} VND failed";

            //await SendNotificationAsync(userId, content, NotificationType.CREDIT, NotificationCategory.Success);
        }

        //public async Task SendWelcomeNotificationAsync(int userId, string displayName)
        //{
        //    var content = $"Welcome to GuEmLaAI, {displayName}!  Start creating your virtual wardrobe today.";
        //    await SendNotificationAsync(userId, content, NotificationType.SYSTEM, NotificationCategory.Info);
        //}

        //public async Task SendSystemNotificationAsync(int userId, string message, NotificationType notificationType, NotificationCategory notificationCategory)
        //{
        //    await SendNotificationAsync(userId, message, notificationType, notificationCategory);
        //}

        // JSON-based helper methods for new notification categories
        

        /// Set global notification active status
        public async Task<bool> SetGlobalNotificationActiveAsync(int notificationId, bool isActive)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == null);

                if (notification == null)
                    return false;

                notification.IsRead = isActive;
                await _context.SaveChangesAsync();

                await _hubContext.Clients.All.SendAsync("ReceiveGlobalNotification", new
                {
                    notification.Id,
                    notification.Type,
                    notification.Content,
                    notification.IsRead,
                    notification.CreatedAt
                });

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationService] Failed to set global notification active status");
                throw;
            }
        }
    }
}
