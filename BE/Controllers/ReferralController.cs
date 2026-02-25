using GuEmLaAI.BusinessObjects.ResponseModels.User;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReferralController : Controller
    {
        private readonly ReferralService _referralService;

        public ReferralController(ReferralService referralService)
        {
            _referralService = referralService;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }

        [HttpGet("referral-info")]
        public async Task<ActionResult<UserReferralResponse>> GetReferralInfo()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var referralInfo = await _referralService.GetReferralInfoAsync(userId.Value);
                return Ok(referralInfo);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("progress")]
        public async Task<ActionResult> GetReferralProgress()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var progress = await _referralService.GetReferralProgressAsync(userId.Value);
                return Ok(progress);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("rewards")]
        public async Task<ActionResult> GetReferralRewards()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var rewards = await _referralService.GetReferralRewardsAsync(userId.Value);
                return Ok(rewards);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("apply-referral")]
        public async Task<ActionResult> ApplyReferralCode([FromBody] ApplyReferralRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(request.ReferralCode))
                    return BadRequest(new { error = "Referral code is required" });

                await _referralService.ApplyReferralCodeAsync(userId.Value, request.ReferralCode);
                return Ok(new { message = "Referral code applied successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("check-completion")]
        public async Task<ActionResult> CheckReferralCompletion()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                var completed = await _referralService.CheckAndCompleteReferralAsync(userId.Value);
                return Ok(new
                {
                    message = completed ? "Referral completed and bonus awarded" : "Referral not yet completed",
                    completed = completed
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        public class ApplyReferralRequest
        {
            public string ReferralCode { get; set; } = string.Empty;
        }
    }
}
