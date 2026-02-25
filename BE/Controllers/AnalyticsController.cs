using Microsoft.AspNetCore.Mvc;
using GuEmLaAI.Services;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AnalyticsService _analyticsService;

        public AnalyticsController(AnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        // Public endpoint - anyone can call this (no [Authorize])
        [HttpPost("track")]
        public async Task<IActionResult> TrackVisit([FromBody] TrackVisitRequest request)
        {
            // ✅ THIS IS THE SESSION LOGIC
            // Check if user already has a session cookie
            var sessionId = Request.Cookies["analytics_session"];

            if (string.IsNullOrEmpty(sessionId))
            {
                // ✅ NO SESSION = NEW VISITOR
                // This is the first page they visit (or session expired)

                // Create new unique session ID
                sessionId = Guid.NewGuid().ToString();

                // ✅ SET COOKIE - Expires in 30 minutes
                Response.Cookies.Append("analytics_session", sessionId, new CookieOptions
                {
                    Expires = DateTimeOffset.UtcNow.AddMinutes(30),
                    HttpOnly = true,
                    Secure = true,  // Keep this for HTTPS
                    SameSite = SameSiteMode.None,  // ✅ Change from Lax to None for CORS
                    Domain = null  // Let browser decide
                });

                // Get user info
                int? userId = null;
                if (User.Identity?.IsAuthenticated == true)
                {
                    userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                }

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();

                // ✅ TRACK THIS AS A NEW SESSION
                await _analyticsService.TrackVisitAsync(
                    request.UserId,
                    ipAddress,
                    userAgent,
                    request.PageUrl,
                    sessionId
                );

                return Ok(new { tracked = true, newSession = true });
            }

            // ✅ SESSION ALREADY EXISTS = Don't count again!
            // User is still browsing (within 30 min)
            return Ok(new { tracked = false, existingSession = true });
        }
    }

    public class TrackVisitRequest
    {
        public string PageUrl { get; set; } = string.Empty;
        public int? UserId { get; set; }
    }
}