using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.Extensions;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            NotificationService notificationService,
            ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications([FromQuery] int limit = 50, [FromQuery] bool unreadOnly = true)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var notifications = await _notificationService.GetUserNotificationsAsync(
                    userId.Value,
                    limit,
                    unreadOnly);

                return Ok(new
                {
                    success = true,
                    data = notifications,
                    count = notifications.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationController] Failed to get notifications");
                return StatusCode(500, new { error = "Failed to retrieve notifications", details = ex.Message });
            }
        }

        [HttpPatch("{id}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var success = await _notificationService.MarkAsReadAsync(id, userId.Value);

                if (!success)
                    return NotFound(new { error = "Notification not found" });

                return Ok(new
                {
                    success = true,
                    message = "Notification marked as read"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationController] Failed to mark notification {id} as read");
                return StatusCode(500, new { error = "Failed to mark notification as read", details = ex.Message });
            }
        }

        [HttpPatch("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var count = await _notificationService.MarkAllAsReadAsync(userId.Value);

                return Ok(new
                {
                    success = true,
                    message = $"{count} notifications marked as read",
                    count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationController] Failed to mark all notifications as read");
                return StatusCode(500, new { error = "Failed to mark all as read", details = ex.Message });
            }
        }

        [HttpPost("global")]
        [AdminAuthorize]
        public async Task<IActionResult> CreateGlobalNotification([FromBody] SendGlobalNotificationRequest? request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    Console.WriteLine($"[NotificationController] Invalid model state: {string.Join(", ", ModelState.Values.SelectMany(v => v.Errors))}");
                    return BadRequest(ModelState);
                }

                if (request == null || (string.IsNullOrWhiteSpace(request.en) && string.IsNullOrWhiteSpace(request.vn)))
                    return BadRequest(new { error = "At least one of 'en' or 'vn' content is required" });

                await _notificationService.SendGlobalNotificationAsync(
                    request.en,
                    request.vn
                );

                return Ok(new
                {
                    success = true,
                    message = "Global notification sent to all users"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationController] Failed to send global notification");
                return StatusCode(500, new { error = "Failed to send global notification", details = ex.Message });
            }
        }

        [HttpGet("global")]
        [Authorize]
        public async Task<IActionResult> GetGlobalNotifications(bool unreadOnly, [FromQuery] int limit = 50)
        {
            try
            {
                var notifications = await _notificationService.GetUserNotificationsAsync(
                    null, // Get global notifications
                    limit,
                    unreadOnly);

                return Ok(new
                {
                    success = true,
                    data = notifications,
                    count = notifications.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationController] Failed to get global notifications");
                return StatusCode(500, new { error = "Failed to retrieve global notifications", details = ex.Message });
            }
        }

        [HttpPatch("global/{id}/{isActive}")]
        [AdminAuthorize]
        public async Task<IActionResult> SetGlobalNotificationActive(int id, bool isActive)
        {
            try
            {
                var success = await _notificationService.SetGlobalNotificationActiveAsync(id, isActive);

                if (!success)
                    return NotFound(new { error = "Global notification not found" });

                return Ok(new
                {
                    success = true,
                    message = $"Global notification {(isActive ? "activated" : "deactivated")}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationController] Failed to set global notification {id} active status");
                return StatusCode(500, new { error = "Failed to update global notification", details = ex.Message });
            }
        }

        [HttpDelete("global/{id}")]
        [AdminAuthorize]
        public async Task<IActionResult> DeleteGlobalNotification(int id)
        {
            try
            {
                var success = await _notificationService.DeleteNotificationAsync(id, null); // null for global

                if (!success)
                    return NotFound(new { error = "Global notification not found" });

                return Ok(new
                {
                    success = true,
                    message = "Global notification deleted"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[NotificationController] Failed to delete global notification {id}");
                return StatusCode(500, new { error = "Failed to delete global notification", details = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }
    }

    public class CreateTestNotificationRequest
    {
        public string Type { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class SendGlobalNotificationRequest
    {
        public string vn { get; set; } = string.Empty;
        public string en { get; set; } = string.Empty;
        public NotificationType? Type { get; set; }
    }

    //public class SendGlobalNotificationRequest
    //{
    //    public string Content { get; set; } = string.Empty;
    //    public NotificationType? Type { get; set; }
    //}
}
