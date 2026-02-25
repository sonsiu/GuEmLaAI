using System.Text.Json;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace GuEmLaAI.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : Controller {
        private readonly UserService _userService;

        public UserController(UserService userService) {
            _userService = userService;
        }

        [HttpGet("item-descriptions/{userId}")]
        public async Task<IActionResult> GetUserItemDescriptions(int userId) {
            var snapshot = await _userService.GetUserWardrobeSnapshotAsync(userId);

            if (snapshot == null || snapshot.Items == null || !snapshot.Items.Any())
                return NotFound(new { message = "No items found for this user." });

            var json = JsonSerializer.Serialize(new
            {
                wardrobe = snapshot.Items,
                lastModified = snapshot.LastModifiedUtc,
                version = snapshot.Version
            }, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            var fileName = $"user_{userId}_items.json";

            return File(bytes, "application/json", fileName);
        }

        // Avoid intermediary/browser caching to ensure schema updates are observed.
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        [HttpGet("item-descriptions/{userId}/raw")]
        public async Task<IActionResult> GetUserItemDescriptionsRaw(int userId) {
            var snapshot = await _userService.GetUserWardrobeSnapshotAsync(userId);

            if (snapshot == null || snapshot.Items == null || !snapshot.Items.Any())
                return NotFound(new { message = "No items found for this user." });

            var etag = $"W/\"{snapshot.Version}\"";
            var clientEtags = Request.Headers.IfNoneMatch;
            if (clientEtags.Any() && clientEtags.Contains(etag))
            {
                return StatusCode(304);
            }

            Response.Headers.CacheControl = "no-store";
            Response.Headers.ETag = etag;
            Response.Headers.LastModified = snapshot.LastModifiedUtc.ToUniversalTime().ToString("R");

            return Ok(new
            {
                wardrobe = snapshot.Items,
                lastModified = snapshot.LastModifiedUtc,
                version = snapshot.Version
            });
        }

    }
}
