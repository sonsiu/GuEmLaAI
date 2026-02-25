using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.Models;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CreditController : ControllerBase
    {
        private readonly CreditService _creditService;

        public CreditController(CreditService creditService)
        {
            _creditService = creditService;
        }

        [HttpGet("balance")]
        public async Task<ActionResult<int>> GetCreditBalance()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var balance = await _creditService.GetUserCreditsAsync(userId.Value);
            return Ok(new { balance, userId = userId.Value });
        }
        [HttpGet("history")]
        public async Task<ActionResult<List<CreditTransaction>>> GetCreditHistory([FromQuery] int? limit = 50)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var history = await _creditService.GetCreditHistoryAsync(userId.Value, limit);
            return Ok(history);
        }

        [HttpPost("use")]
        public async Task<ActionResult> UseCredits([FromBody] UseCreditRequest request)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var success = await _creditService.UseCreditsAsync(
                userId.Value, 
                request.Amount, 
                request.Description, 
                request.ReferenceId
            );

            if (success)
            {
                var newBalance = await _creditService.GetUserCreditsAsync(userId.Value);
                return Ok(new { success = true, newBalance, message = "Credits used successfully" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Insufficient credits or operation failed" });
            }
        }

        [HttpPost("award-bonus")]
        [Authorize] // Assuming you have role-based authorization
        public async Task<ActionResult> AwardBonusCredits([FromBody] AwardBonusCreditRequest request)
        {
            var success = await _creditService.AwardBonusCreditsAsync(
                request.UserId,
                request.Amount,
                request.Description,
                request.ReferenceId
            );

            if (success)
            {
                return Ok(new { success = true, message = "Bonus credits awarded successfully" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Failed to award bonus credits" });
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

    public class UseCreditRequest
    {
        public int Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
    }

    public class AwardBonusCreditRequest
    {
        public int UserId { get; set; }
        public int Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
    }
}