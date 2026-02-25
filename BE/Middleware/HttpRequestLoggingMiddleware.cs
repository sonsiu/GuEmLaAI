using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.HttpLog;
using GuEmLaAI.Services;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;

namespace GuEmLaAI.Middleware
{
    /// <summary>
    /// Middleware to intercept and selectively log HTTP requests.
    /// Handles all configuration logic and filtering.
    /// Only logs errors, slow requests, and monitored endpoints to prevent database bloat.
    /// </summary>
    public class HttpRequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<HttpRequestLoggingMiddleware> _logger;
        private readonly HttpRequestLoggingConfig _config;

        public HttpRequestLoggingMiddleware(
            RequestDelegate next,
            ILogger<HttpRequestLoggingMiddleware> logger,
            IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _config = configuration.GetSection("HttpRequestLogging").Get<HttpRequestLoggingConfig>()
                ?? throw new InvalidOperationException("HttpRequestLogging configuration section is missing.");
        }

        public async Task InvokeAsync(
            HttpContext context,
            IServiceScopeFactory serviceScopeFactory,
            HttpRequestLoggingService loggingService)
        {
            var stopwatch = Stopwatch.StartNew();
            var requestTime = DateTime.UtcNow;

            // Get user ID from claims if authenticated
            int? userId = null;
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var id))
                {
                    userId = id;
                }
            }

            // Read request body only if configured
            string requestBody = string.Empty;
            context.Request.EnableBuffering();
            if (_config.LogRequestBodies && context.Request.ContentLength > 0 && context.Request.ContentType?.Contains("application/json") == true)
            {
                try
                {
                    using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
                    {
                        requestBody = await reader.ReadToEndAsync();
                        context.Request.Body.Position = 0;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error reading request body");
                }
            }

            var originalBodyStream = context.Response.Body;
            using (var responseBody = new MemoryStream())
            {
                context.Response.Body = responseBody;

                try
                {
                    await _next(context);
                    stopwatch.Stop();

                    // Capture request data
                    var logData = CaptureRequestData(
                        context, 
                        requestTime, 
                        requestBody, 
                        string.Empty, 
                        (double)stopwatch.ElapsedMilliseconds, 
                        userId, 
                        null);

                    // Check if we should log this request
                    if (ShouldLog(logData))
                    {
                        // Read response body only if logging AND configured
                        if (_config.LogResponseBodies)
                        {
                            string responseBodyContent = await ReadResponseBodyAsync(responseBody);
                            logData.ResponseBody = SanitizeBody(responseBodyContent, 5000);
                            logData.ResponseSizeBytes = string.IsNullOrEmpty(responseBodyContent) ? null : (long)Encoding.UTF8.GetByteCount(responseBodyContent);
                        }

                        await LogRequestToDatabaseAsync(serviceScopeFactory, loggingService, logData);
                    }

                    // Copy response to original stream
                    responseBody.Seek(0, SeekOrigin.Begin);
                    await responseBody.CopyToAsync(originalBodyStream);
                }
                catch (Exception ex)
                {
                    stopwatch.Stop();

                    _logger.LogError(ex, "Error in HTTP request pipeline");

                    var logData = CaptureRequestData(
                        context, 
                        requestTime, 
                        requestBody, 
                        string.Empty, 
                        (double)stopwatch.ElapsedMilliseconds, 
                        userId, 
                        ex.Message);

                    // Always log errors
                    await LogRequestToDatabaseAsync(serviceScopeFactory, loggingService, logData);

                    throw;
                }
                finally
                {
                    context.Response.Body = originalBodyStream;
                }
            }
        }

        /// <summary>
        /// Determines if a request should be logged based on configured rules.
        /// </summary>
        private bool ShouldLog(HttpRequestLogData logData)
        {
            // 1. Skip excluded endpoints
            if (_config.ExcludedEndpoints.Any(endpoint => logData.Path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase)))
                return false;

            // 2. Always log errors and slow requests (for monitored endpoints only)
            if (IsErrorOrSlowRequest(logData) && IsMonitoredEndpoint(logData.Path))
                return true;

            // 3. Skip logging if disabled
            if (!_config.Enabled)
                return false;

            // 4. Only log monitored endpoints
            if (IsMonitoredEndpoint(logData.Path))
                return true;

            // 5. Skip everything else
            return false;
        }

        private bool IsMonitoredEndpoint(string path)
        {
            return _config.MonitoredEndpoints.Any(endpoint => path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Checks if a request is an error or slow request.
        /// </summary>
        private bool IsErrorOrSlowRequest(HttpRequestLogData logData)
        {
            // Log 4xx and 5xx errors
            if (logData.StatusCode >= 400)
                return true;

            // Log slow requests (> threshold)
            if (logData.ElapsedMilliseconds > _config.SlowRequestThresholdMs)
                return true;

            // Log requests with errors
            if (!string.IsNullOrEmpty(logData.ErrorMessage))
                return true;

            return false;
        }

        private HttpRequestLogData CaptureRequestData(
            HttpContext context,
            DateTime requestTime,
            string requestBody,
            string responseBody,
            double elapsedMs,
            int? userId,
            string? errorMessage)
        {
            var routeData = context.GetRouteData();
            
            return new HttpRequestLogData
            {
                RequestTime = requestTime,
                Method = context.Request.Method,
                Path = context.Request.Path.Value ?? "/",
                QueryString = context.Request.QueryString.Value ?? string.Empty,
                UserId = userId,
                IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                UserAgent = context.Request.Headers["User-Agent"].ToString() ?? "Unknown",
                StatusCode = context.Response.StatusCode,
                ResponseSizeBytes = string.IsNullOrEmpty(responseBody) ? null : (long)Encoding.UTF8.GetByteCount(responseBody),
                RequestSizeBytes = string.IsNullOrEmpty(requestBody) ? null : (long)Encoding.UTF8.GetByteCount(requestBody),
                ElapsedMilliseconds = elapsedMs,
                Controller = routeData?.Values["controller"]?.ToString() ?? "Unknown",
                Action = routeData?.Values["action"]?.ToString() ?? "Unknown",
                RequestBody = _config.LogRequestBodies ? SanitizeBody(requestBody, 5000) : null,
                ResponseBody = responseBody,
                ErrorMessage = errorMessage
            };
        }

        private async Task<string> ReadResponseBodyAsync(MemoryStream responseBody)
        {
            try
            {
                responseBody.Seek(0, SeekOrigin.Begin);
                using (var reader = new StreamReader(responseBody, Encoding.UTF8, leaveOpen: true))
                {
                    return await reader.ReadToEndAsync();
                }
            }
            catch
            {
                return string.Empty;
            }
        }

        private async Task LogRequestToDatabaseAsync(
            IServiceScopeFactory serviceScopeFactory,
            HttpRequestLoggingService loggingService,
            HttpRequestLogData logData)
        {
            try
            {
                using (var scope = serviceScopeFactory.CreateScope())
                {
                    var requestLog = new HttpRequestLog
                    {
                        RequestTime = logData.RequestTime,
                        Method = logData.Method,
                        Path = logData.Path,
                        QueryString = logData.QueryString,
                        UserId = logData.UserId,
                        IpAddress = logData.IpAddress,
                        UserAgent = logData.UserAgent,
                        StatusCode = logData.StatusCode,
                        ResponseSizeBytes = logData.ResponseSizeBytes,
                        RequestSizeBytes = logData.RequestSizeBytes,
                        ElapsedMilliseconds = logData.ElapsedMilliseconds,
                        Controller = logData.Controller,
                        Action = logData.Action,
                        RequestBody = logData.RequestBody,
                        ResponseBody = logData.ResponseBody,
                        ErrorMessage = logData.ErrorMessage,
                        CreatedAt = DateTime.UtcNow
                    };

                    await loggingService.LogRequestAsync(requestLog);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log HTTP request to database");
            }
        }

        private string SanitizeBody(string body, int maxLength)
        {
            if (string.IsNullOrEmpty(body))
                return body;

            if (body.Length > maxLength)
                return body[..maxLength] + "... [truncated]";

            return body;
        }
    }

    /// <summary>
    /// Configuration for HTTP request logging behavior.
    /// </summary>
    public class HttpRequestLoggingConfig
    {
        public bool Enabled { get; set; } = false;
        public List<string> MonitoredEndpoints { get; set; } = new();
        public List<string> ExcludedEndpoints { get; set; } = new();
        public int RetentionDays { get; set; } = 7;
        public int SlowRequestThresholdMs { get; set; } = 5000;
        public bool LogRequestBodies { get; set; } = false;
        public bool LogResponseBodies { get; set; } = false;
    }
}
