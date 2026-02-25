using GuEmLaAI.BusinessObjects.RequestModels.Outfit;
using GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OutfitSuggestController : ControllerBase
    {
        private readonly OutfitSuggestService _outfitSuggestService;

        public OutfitSuggestController(OutfitSuggestService outfitSuggestService)
        {
            _outfitSuggestService = outfitSuggestService ?? throw new ArgumentNullException(nameof(outfitSuggestService));
        }

        [HttpGet("checkItemCreatedRequirement")]
        public async Task<IActionResult> CheckItemCreatedRequirement()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            try
            {
                var requirementMet = await _outfitSuggestService.CheckRequirementAysnc(userId.Value);
                return Ok(new { requirementMet });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("loadModels")]
        public async Task<IActionResult> GetUserModels()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            try
            {
                var models = await _outfitSuggestService.GetModelsAsync(userId.Value);
                return Ok(new { data = models });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("setDefaultModel")]
        public async Task<IActionResult> SetDefaultModel([FromQuery] string fileName)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return BadRequest(new { error = "File name is required" });
            }

            try
            {
                var success = await _outfitSuggestService.SetDefaultModel(userId.Value, fileName);
                if (!success)
                {
                    return BadRequest(new { error = "Failed to set default model. File may not exist or belong to another user." });
                }

                return Ok(new { message = "Default model updated successfully", fileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int limit = 50)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var safeLimit = Math.Clamp(limit, 1, 200);
            var history = await _outfitSuggestService.GetHistoryAsync(userId.Value, safeLimit);
            return Ok(new { data = history });
        }

        // POST alias for environments where GET may be blocked or cached
        [HttpPost("history/list")]
        public async Task<IActionResult> GetHistoryPost([FromBody] int? limit)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var history = await _outfitSuggestService.GetHistoryAsync(userId.Value, safeLimit);
            return Ok(new { data = history });
        }

        [HttpPost("history")]
        public async Task<IActionResult> SaveHistory([FromBody] SaveSuggestionHistoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request payload" });
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            try
            {
                // Validate that we have options with generated images
                var hasOptions = request.Options != null && request.Options.Count > 0 
                    && request.Options.Any(o => !string.IsNullOrEmpty(o.GeneratedImageUrl));
                
                if (!hasOptions)
                {
                    return BadRequest(new { error = "No generated images to save." });
                }

                var id = await _outfitSuggestService.SaveHistoryAsync(userId.Value, request);
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpDelete("history/{id:int}")]
        public async Task<IActionResult> DeleteHistory([FromRoute] int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var deleted = await _outfitSuggestService.DeleteHistoryAsync(userId.Value, id);
            if (!deleted)
            {
                return NotFound(new { error = "History entry not found or does not belong to the user" });
            }

            return Ok(new { success = true });
        }

        [HttpDelete("history/clear")]
        public async Task<IActionResult> ClearHistory()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var removedCount = await _outfitSuggestService.ClearHistoryAsync(userId.Value);
            return Ok(new { success = true, removed = removedCount });
        }

        [HttpPost("save-from-suggestion")]
        public async Task<IActionResult> SaveOutfitFromTryOn([FromBody] SaveSuggsetionOutfitRequest request)
        {
            try
            {
                // Get current user ID from JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
                var outfitId = await _outfitSuggestService.SaveOutfitFromSuggestionAsync(userId, request);

                return Ok(new
                {
                    message = "Outfit saved successfully from try-on result"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        private int? GetCurrentUserId()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
                {
                    return parsedUserId;
                }
            }
            return null;
        }
    }
}
