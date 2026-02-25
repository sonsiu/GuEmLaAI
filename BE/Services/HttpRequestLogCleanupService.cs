using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace GuEmLaAI.Services
{
    /// <summary>
    /// Background service to periodically clean up old HTTP request logs.
    /// Runs daily to prevent database bloat.
    /// </summary>
    public class HttpRequestLogCleanupService : BackgroundService
    {
        private readonly ILogger<HttpRequestLogCleanupService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;
        private PeriodicTimer? _timer;

        public HttpRequestLogCleanupService(
            ILogger<HttpRequestLogCleanupService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("HTTP Request Log Cleanup Service is starting.");

            try
            {
                // Schedule cleanup to run at 2 AM UTC daily
                var now = DateTime.UtcNow;
                var nextScheduledTime = now.Date.AddHours(2); // 2 AM UTC

                if (nextScheduledTime <= now)
                {
                    nextScheduledTime = nextScheduledTime.AddDays(1);
                }

                var initialDelay = nextScheduledTime - now;

                _logger.LogInformation(
                    "Next HTTP log cleanup scheduled for: {NextScheduledTime}. Initial delay: {TimeRemaining}",
                    nextScheduledTime,
                    initialDelay);

                // Wait for the first execution
                await Task.Delay(initialDelay, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    return;

                // Execute immediately on first run
                await ExecuteCleanupAsync(stoppingToken);

                // Run daily after that
                using (_timer = new PeriodicTimer(TimeSpan.FromHours(24)))
                {
                    while (await _timer.WaitForNextTickAsync(stoppingToken))
                    {
                        if (stoppingToken.IsCancellationRequested)
                            break;

                        await ExecuteCleanupAsync(stoppingToken);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("HTTP Request Log Cleanup Service is stopping.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error in HTTP Request Log Cleanup Service");
            }
        }

        private async Task ExecuteCleanupAsync(CancellationToken stoppingToken, int retryCount = 0, int maxRetries = 3)
        {
            _logger.LogInformation(
                "Executing HTTP request log cleanup at {Time} (Attempt {Attempt}/{MaxAttempts})",
                DateTime.UtcNow,
                retryCount + 1,
                maxRetries + 1);

            try
            {
                // Get retention days from configuration - throw if not configured
                var retentionDaysValue = _configuration.GetSection("HttpRequestLogging").GetValue<int?>("RetentionDays");

                if (!retentionDaysValue.HasValue)
                {
                    throw new InvalidOperationException(
                        "HttpRequestLogging:RetentionDays configuration value is missing or invalid.");
                }

                var retentionDays = retentionDaysValue.Value;

                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var loggingService = scope.ServiceProvider.GetRequiredService<HttpRequestLoggingService>();
                    var deletedCount = await loggingService.CleanupOldLogsAsync(retentionDays);

                    _logger.LogInformation(
                        "HTTP request log cleanup completed successfully. Deleted {Count} old logs.",
                        deletedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error executing HTTP request log cleanup. Attempt {Attempt}/{MaxAttempts}",
                    retryCount + 1,
                    maxRetries + 1);

                // Retry logic: wait 5 minutes and retry up to 3 times
                if (retryCount < maxRetries)
                {
                    _logger.LogInformation("Retrying cleanup in 5 minutes...");
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        await ExecuteCleanupAsync(stoppingToken, retryCount + 1, maxRetries);
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogInformation("Cleanup retry cancelled");
                    }
                }
                else
                {
                    _logger.LogError("Max cleanup retries exceeded. Will retry tomorrow.");
                }
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("HTTP Request Log Cleanup Service is stopping.");
            _timer?.Dispose();
            await base.StopAsync(stoppingToken);
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
