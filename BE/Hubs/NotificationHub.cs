using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace GuEmLaAI.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation($"[NotificationHub] User {userId} connected with ConnectionId: {Context.ConnectionId}");
            }
            else
            {
                _logger.LogWarning($"[NotificationHub] Anonymous connection attempt: {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation($"[NotificationHub] User {userId} disconnected");
            }

            if (exception != null)
            {
                _logger.LogError(exception, $"[NotificationHub] Connection error for {Context.ConnectionId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// Client can call this method to mark a notification as read
        public async Task MarkNotificationAsRead(int notificationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation($"[NotificationHub] User {userId} marking notification {notificationId} as read");
            await Task.CompletedTask;
        }

      
        public async Task BroadcastImageGenerationCountUpdate(int userId, int count)
        {
            _logger.LogInformation($"[NotificationHub] Broadcasting image generation count update: UserId={userId}, Count={count}");
            
            await Clients.Group($"user_{userId}").SendAsync(
                "ReceiveImageGenerationCountUpdate", 
                new 
                { 
                    count = count,
                    timestamp = DateTime.UtcNow,
                    type = "image_generation"
                }
            );
        }
        public async Task BroadcastModelPictureCountUpdate(int userId, int count)
        {
            _logger.LogInformation($"[NotificationHub] Broadcasting model picture count update: UserId={userId}, Count={count}");
            
            await Clients.Group($"user_{userId}").SendAsync(
                "ReceiveModelPictureCountUpdate", 
                new 
                { 
                    count = count,
                    timestamp = DateTime.UtcNow,
                    type = "model_picture"
                }
            );
        }

        public async Task BroadcastItemGeneratedCountUpdate(int userId, int count)
        {
            _logger.LogInformation($"[NotificationHub] Broadcasting Item count update: UserId={userId}, Count={count}");

            await Clients.Group($"user_{userId}").SendAsync(
                "ReceiveItemGenerationCountUpdate",
                new
                {
                    count = count,
                    timestamp = DateTime.UtcNow,
                    type = "item_generation"
                }
            );
        }

        public async Task BroadcastLastestGeneratedImage(int userId, int count)
        {
            await Clients.Group($"user_{userId}").SendAsync(
                "ReceiveLatestGenratedImage",
                new
                {
                    count = count,
                    timestamp = DateTime.UtcNow,
                    type = "model_picture"
                }
            );
        }

        ///// Send a test notification (for debugging)
        //public async Task SendTestNotification()
        //{
        //    var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        //    if (!string.IsNullOrEmpty(userId))
        //    {
        //        await Clients.Caller.SendAsync("ReceiveNotification", new
        //        {
        //            Id = 0,
        //            Type = "TEST",
        //            Content = "This is a test notification",
        //            IsRead = false,
        //            CreatedAt = DateTime.UtcNow
        //        });
        //    }
        //}
    }
}
