using GuEmLaAI.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    /// <summary>
    /// Service to manage HTTP request logging database operations.
    /// Only handles saving and cleaning up logs.
    /// </summary>
    public class HttpRequestLoggingService
    {
        private readonly GuEmLaAiContext _dbContext;
        private readonly ILogger<HttpRequestLoggingService> _logger;

        public HttpRequestLoggingService(
            GuEmLaAiContext dbContext,
            ILogger<HttpRequestLoggingService> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Saves request log to database.
        /// </summary>
        public async Task LogRequestAsync(HttpRequestLog requestLog)
        {
            try
            {
                _dbContext.HttpRequestLogs.Add(requestLog);
                await _dbContext.SaveChangesAsync();

                _logger.LogDebug(
                    "HTTP Request logged - {Method} {Path} - Status: {StatusCode}",
                    requestLog.Method,
                    requestLog.Path,
                    requestLog.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log HTTP request to database");
            }
        }

        /// <summary>
        /// Cleans up old logs based on retention policy.
        /// </summary>
        public async Task<int> CleanupOldLogsAsync(int retentionDays)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
                var logsToDelete = await _dbContext.HttpRequestLogs
                    .Where(x => x.RequestTime < cutoffDate)
                    .ToListAsync();

                if (logsToDelete.Count == 0)
                    return 0;

                _dbContext.HttpRequestLogs.RemoveRange(logsToDelete);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Deleted {Count} HTTP request logs older than {Days} days",
                    logsToDelete.Count,
                    retentionDays);

                return logsToDelete.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old HTTP request logs");
                return 0;
            }
        }

        /// <summary>
        /// Gets logged HTTP requests with optional filtering.
        /// </summary>
        public async Task<List<HttpRequestLog>> GetLogsAsync(
            int? userId,
            int limit,
            string? path = null,
            int? statusCode = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _dbContext.HttpRequestLogs.AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId);

            if (!string.IsNullOrEmpty(path))
                query = query.Where(x => x.Path.Contains(path));

            if (statusCode.HasValue)
                query = query.Where(x => x.StatusCode == statusCode);

            if (startDate.HasValue)
                query = query.Where(x => x.RequestTime >= startDate);

            if (endDate.HasValue)
                query = query.Where(x => x.RequestTime <= endDate);

            return await query
                .OrderByDescending(x => x.RequestTime)
                .Take(limit)
                .ToListAsync();
        }
    }
}
