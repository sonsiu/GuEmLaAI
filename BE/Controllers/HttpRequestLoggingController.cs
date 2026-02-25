using GuEmLaAI.Extensions;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AdminAuthorize]
    public class HttpRequestLoggingController : ControllerBase
    {
        private readonly HttpRequestLoggingService _loggingService;
        private readonly ILogger<HttpRequestLoggingController> _logger;

        public HttpRequestLoggingController(
            HttpRequestLoggingService loggingService,
            ILogger<HttpRequestLoggingController> logger)
        {
            _loggingService = loggingService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves HTTP request logs with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] int? userId,
            [FromQuery] int limit,
            [FromQuery] string? path = null,
            [FromQuery] int? statusCode = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var logs = await _loggingService.GetLogsAsync(
                    userId,
                    limit,
                    path,
                    statusCode,
                    startDate,
                    endDate);

                return Ok(new
                {
                    success = true,
                    data = logs,
                    count = logs.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HttpRequestLoggingController] Failed to retrieve logs");
                return StatusCode(500, new { error = "Failed to retrieve logs", details = ex.Message });
            }
        }
    }
}