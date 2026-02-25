using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.Services
{
    /// <summary>
    /// Background service that handles daily scheduled tasks:
    /// - Resets TodayImageGeneratedCount to 0 at midnight
    /// - Resets TodayModelPictureCreatedCount to 0 at midnight
    /// </summary>
    public class ScheduledTaskService : BackgroundService
    {
        private readonly ILogger<ScheduledTaskService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private PeriodicTimer? _timer;

        public ScheduledTaskService(
            ILogger<ScheduledTaskService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheduled Task Service is starting.");

            try
            {
                var now = DateTime.Now;
                var nextScheduledTime = now.Date.AddDays(1); // Tomorrow at 00:00 (midnight)
                
                if (nextScheduledTime <= now)
                {
                    nextScheduledTime = nextScheduledTime.AddDays(1);
                }
                
                var initialDelay = nextScheduledTime - now;
                
                _logger.LogInformation(
                    "Next reset scheduled for: {NextScheduledTime}. Initial delay: {TimeRemaining}",
                    nextScheduledTime,
                    initialDelay);

                // Wait for the first execution
                await Task.Delay(initialDelay, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    return;

                // Execute immediately on first run
                await ExecuteResetAsync(stoppingToken);

                using (_timer = new PeriodicTimer(TimeSpan.FromHours(24)))
                {
                    while (await _timer.WaitForNextTickAsync(stoppingToken))
                    {
                        if (stoppingToken.IsCancellationRequested)
                            break;

                        await ExecuteResetAsync(stoppingToken);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Scheduled Task Service is stopping.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error in Scheduled Task Service");
            }
        }

        private async Task ExecuteResetAsync(CancellationToken stoppingToken, int retryCount = 0, int maxRetries = 3)
        {
            _logger.LogInformation("Executing daily count reset at {Time} (Attempt {Attempt}/{MaxAttempts})", 
                DateTime.Now, retryCount + 1, maxRetries + 1);

            try
            {
                // Create a new scope to resolve scoped services
                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<GuEmLaAiContext>();

                    // Reset all users' daily image generation counts
                    await ResetUserDailyCountsAsync(context, stoppingToken);
                }

                _logger.LogInformation("Daily count reset completed successfully at {Time}", DateTime.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing daily count reset. Attempt {Attempt}/{MaxAttempts}", 
                    retryCount + 1, maxRetries + 1);
                
                // Retry logic: wait 5 minutes and retry up to 3 times
                if (retryCount < maxRetries)
                {
                    _logger.LogInformation("Retrying in 5 minutes...");
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        await ExecuteResetAsync(stoppingToken, retryCount + 1, maxRetries);
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogInformation("Retry cancelled");
                    }
                }
                else
                {
                    _logger.LogError("Max retries exceeded. Will retry tomorrow.");
                }
            }
        }

        private async Task ResetUserDailyCountsAsync(GuEmLaAiContext context, CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Starting to reset daily counts for all users...");

                var allUsers = context.Users.ToList();
                _logger.LogInformation("Found {UserCount} users to reset", allUsers.Count);

                if (allUsers.Count == 0)
                {
                    _logger.LogInformation("No users found to reset");
                    return;
                }

                int resetCount = 0;
                int usersWithNonZeroImageCount = 0;
                int usersWithNonZeroModelCount = 0;

                // Reset counts for each user
                foreach (var user in allUsers)
                {
                    if (stoppingToken.IsCancellationRequested)
                    {
                        _logger.LogWarning("Daily count reset was cancelled. {ResetCount} users processed so far", resetCount);
                        break;
                    }

                    bool hasImageCountToReset = user.TodayImageGeneratedCount.HasValue && user.TodayImageGeneratedCount.Value > 0;
                    bool hasModelCountToReset = user.TodayModelPictureCreatedCount.HasValue && user.TodayModelPictureCreatedCount.Value > 0;
                    bool  hasItemCountToReset = user.TodayItemGeneratedCount.HasValue && user.TodayItemGeneratedCount.Value > 0;

                    if (hasImageCountToReset || hasModelCountToReset || hasItemCountToReset)
                    {
                        try
                        {
                            if (hasImageCountToReset)
                            {
                                _logger.LogDebug(
                                    "Resetting TodayImageGeneratedCount for User {UserId} ({Email}) from {OldValue} to 0",
                                    user.Id,
                                    user.Email,
                                    user.TodayImageGeneratedCount);
                                usersWithNonZeroImageCount++;
                            }

                            if (hasModelCountToReset)
                            {
                                _logger.LogDebug(
                                    "Resetting TodayModelPictureCreatedCount for User {UserId} ({Email}) from {OldValue} to 0",
                                    user.Id,
                                    user.Email,
                                    user.TodayModelPictureCreatedCount);
                                usersWithNonZeroModelCount++;
                            }

                            // Reset both counters to 0
                            user.TodayImageGeneratedCount = 0;
                            user.TodayModelPictureCreatedCount = 0;
                            user.TodayItemGeneratedCount = 0;

                            resetCount++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(
                                ex,
                                "Error preparing reset for User {UserId} ({Email})",
                                user.Id,
                                user.Email);
                        }
                    }
                }

                // Save changes to database in batch
                if (resetCount > 0)
                {
                    try
                    {
                        int changesCount = await context.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation(
                            "Successfully reset daily counts. {ResetCount} users updated ({ImageResets} image counts, {ModelResets} model counts). {ChangesCount} database changes applied.",
                            resetCount,
                            usersWithNonZeroImageCount,
                            usersWithNonZeroModelCount,
                            changesCount);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error saving reset counts to database");
                        throw;
                    }
                }
                else
                {
                    _logger.LogInformation("No users had non-zero counts to reset");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting user daily counts");
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheduled Task Service is stopping.");
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
