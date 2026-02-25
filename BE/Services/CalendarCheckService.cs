using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.Enums;

namespace GuEmLaAI.Services
{
    public class CalendarCheckService : BackgroundService
    {
        private readonly ILogger<CalendarCheckService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private PeriodicTimer? _timer;

        public CalendarCheckService(
            ILogger<CalendarCheckService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
           // _logger.LogInformation("Calendar Check Service is starting.");

            try
            {
                var now = DateTime.Now;
                var nextScheduledTime = now.Date.AddHours(23).AddMinutes(55); // Today at 13:15 (6:00 AM)
                
                if (nextScheduledTime <= now)
                {
                    nextScheduledTime = nextScheduledTime.AddDays(1);
                }
                
                var initialDelay = nextScheduledTime - now;
                
                //_logger.LogInformation(
                //    "Next check scheduled for: {NextScheduledTime}. Initial delay: {TimeRemaining}",
                //    nextScheduledTime,
                //    initialDelay);

                // Wait for the first execution
                await Task.Delay(initialDelay, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    return;

                // Execute immediately on first run
                await ExecuteCheckAsync(stoppingToken);

                using (_timer = new PeriodicTimer(TimeSpan.FromHours(24)))
                {
                    while (await _timer.WaitForNextTickAsync(stoppingToken))
                    {
                        if (stoppingToken.IsCancellationRequested)
                            break;

                        await ExecuteCheckAsync(stoppingToken);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Calendar Check Service is stopping.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error in Calendar Check Service");
            }
        }

        private async Task ExecuteCheckAsync(CancellationToken stoppingToken, int retryCount = 0, int maxRetries = 3)
        {
            //_logger.LogInformation("Executing checking functions at {Time} (Attempt {Attempt}/{MaxAttempts})", 
            //    DateTime.Now, retryCount + 1, maxRetries + 1);

            try
            {
                // Create a new scope to resolve scoped services
                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var calendarService = scope.ServiceProvider.GetRequiredService<CalendarService>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();
                    var itemService = scope.ServiceProvider.GetRequiredService<ItemService>();
                    var outfitService = scope.ServiceProvider.GetRequiredService<OutfitService>();

                    // Execute checking functions
                    await SendDailyRemindersAsync(scope.ServiceProvider, calendarService, notificationService, itemService, outfitService, stoppingToken);
                }

                //_logger.LogInformation("Checking functions completed successfully at {Time}", DateTime.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing checking functions. Attempt {Attempt}/{MaxAttempts}", 
                    retryCount + 1, maxRetries + 1);
                
                // Retry logic: wait 5 minutes and retry up to 3 times
                if (retryCount < maxRetries)
                {
                    //_logger.LogInformation("Retrying in 5 minutes...");
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        await ExecuteCheckAsync(stoppingToken, retryCount + 1, maxRetries);
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

        /// <summary>
        /// Retrieves all users with valid calendar data for today and sends notifications
        /// </summary>
        private async Task SendDailyRemindersAsync(
            IServiceProvider serviceProvider,
            CalendarService calendarService,
            NotificationService notificationService,
            ItemService itemService,
            OutfitService outfitService,
            CancellationToken stoppingToken)
        {
            try
            {
                //_logger.LogInformation("Sending daily reminders...");
                
                var usersWithTodayCalendar = await GetUsersWithTodayCalendarAsync(calendarService);
                
                if (usersWithTodayCalendar.Count == 0)
                {
                    _logger.LogInformation("No users with valid calendar data for today");
                    return;
                }

                //_logger.LogInformation("Found {Count} users with calendar data for today", usersWithTodayCalendar.Count);

                // Send email notifications to each user
                var emailService = serviceProvider.GetRequiredService<EmailService>();
                foreach (var user in usersWithTodayCalendar)
                {
                    try
                    {
                        await SendCalendarReminderEmailAsync(emailService, user, itemService, outfitService, stoppingToken);
                        _logger.LogInformation("Reminder email sent successfully to user {UserId} ({Email})", user.Id, user.Email);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send reminder email to user {UserId} ({Email})", user.Id, user.Email);
                        // Continue sending to other users even if one fails
                    }
                }

               // _logger.LogInformation("Daily reminders processed for {Count} users", usersWithTodayCalendar.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending daily reminders");
                throw;
            }
        }

        /// <summary>
        /// Sends a calendar reminder email to a user
        /// </summary>
        private async Task SendCalendarReminderEmailAsync(EmailService emailService, User user, ItemService itemService, OutfitService outfitService, CancellationToken stoppingToken)
        {
            try
            {
                //_logger.LogInformation("Preparing calendar reminder email for user {UserId}", user.Id);

                // Get today's calendar data to extract counts
                var todayDateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");
                var calendarService = _serviceScopeFactory.CreateScope().ServiceProvider.GetRequiredService<CalendarService>();
                var notificationService = _serviceScopeFactory.CreateScope().ServiceProvider.GetRequiredService<NotificationService>();
                var calendars = await calendarService.GetAllUserCalendarsAsync();
                
                var userCalendar = calendars.FirstOrDefault(c => c.UserId == user.Id);
                
                int itemCount = 0;
                int outfitCount = 0;
                int eventCount = 0;

                if (userCalendar != null && !string.IsNullOrEmpty(userCalendar.JsonTemplate) && userCalendar.JsonTemplate != "{}")
                {
                    try
                    {
                        using (JsonDocument doc = JsonDocument.Parse(userCalendar.JsonTemplate))
                        {
                            JsonElement root = doc.RootElement;
                            JsonElement todayData = default;

                            // Handle nested "calendarData" structure if it exists
                            if (root.TryGetProperty("calendarData", out JsonElement calendarDataProp))
                            {
                                if (calendarDataProp.TryGetProperty(todayDateKey, out todayData))
                                {
                                    var counts = await ExtractCalendarCounts(todayData, itemService, outfitService);
                                    itemCount = counts.ItemCount;
                                    outfitCount = counts.OutfitCount;
                                    eventCount = counts.EventCount;
                                }
                            }
                            else if (root.TryGetProperty(todayDateKey, out todayData))
                            {
                                var counts = await ExtractCalendarCounts(todayData, itemService, outfitService);
                                itemCount = counts.ItemCount;
                                outfitCount = counts.OutfitCount;
                                eventCount = counts.EventCount;
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, "Error parsing calendar JSON for user {UserId}", user.Id);
                    }
                }

                // Get template file path
                string templateFile = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "BusinessObjects",
                    "EmailTemplates",
                    "CalendarReminderTemplate.cshtml"
                );

                if (!File.Exists(templateFile))
                {
                    _logger.LogError("Calendar reminder template file not found at {TemplatePath}", templateFile);
                    return;
                }

                // Format the date for display
                var todayDateFormatted = DateTime.UtcNow.ToString("dddd, MMMM dd, yyyy");
                var currentYear = DateTime.UtcNow.Year.ToString();

                // Prepare email metadata
                var emailMetaData = new EmailMetaData(
                    user.Email,
                    $"Your Daily Calendar Reminder - {DateTime.UtcNow.ToString("MMMM dd, yyyy")}"
                );

                // Send email using calendar reminder template
                await emailService.SendCalendarReminderAsync(
                    emailMetaData,
                    user.DisplayName ?? user.Email,
                    user.Email,
                    itemCount,
                    outfitCount,
                    eventCount,
                    templateFile,
                    todayDateFormatted,
                    currentYear
                );

                //_logger.LogInformation("Calendar reminder email sent successfully to user {UserId} ({Email})", user.Id, user.Email);

                // Send in-app notification to user
                try
                {
                    await notificationService.SendCalendarReminderNotificationAsync(
                        user.Id,
                        itemCount,
                        outfitCount,
                        eventCount
                    );
                    _logger.LogInformation("In-app notification sent successfully to user {UserId}", user.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send in-app notification to user {UserId}, but email was sent", user.Id);
                    // Don't throw - email was already sent successfully
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending calendar reminder email to user {UserId}", user.Id);
                throw;
            }
        }

        private class CalendarCountsResult
        {
            public int ItemCount { get; set; }
            public int OutfitCount { get; set; }
            public int EventCount { get; set; }
        }

        private async Task<CalendarCountsResult> ExtractCalendarCounts(JsonElement todayData, ItemService itemService, OutfitService outfitService)
        {
            var result = new CalendarCountsResult
            {
                ItemCount = 0,
                OutfitCount = 0,
                EventCount = 0
            };
            var todayDateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");

            try
            {
                // Count and process main items array
                if (todayData.TryGetProperty("items", out JsonElement itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
                {
                    result.ItemCount = itemsElement.GetArrayLength();
                    
                    // Update wear count for each item in the main items array
                    foreach (JsonElement item in itemsElement.EnumerateArray())
                    {
                        if (item.TryGetProperty("id", out JsonElement itemIdElement))
                        {
                            if (int.TryParse(itemIdElement.GetRawText(), out int itemId))
                            {
                                try
                                {
                                    await itemService.UpdateItemWearCount(itemId);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning(ex, "Failed to update wear count for main item {ItemId}", itemId);
                                }
                            }
                        }
                    }
                }

                // Count and process main outfit object
                if (todayData.TryGetProperty("outfit", out JsonElement outfitElement) && outfitElement.ValueKind != JsonValueKind.Null)
                {
                    result.OutfitCount = 1; // Single outfit
                    
                    // Update wear count for the main outfit
                    if (outfitElement.TryGetProperty("id", out JsonElement outfitIdElement))
                    {
                        if (int.TryParse(outfitIdElement.GetRawText(), out int outfitId))
                        {
                            try
                            {
                                await outfitService.UpdateOutfitWearCount(outfitId);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to update wear count for main outfit {OutfitId}", outfitId);
                            }
                        }
                    }
                }

                // Count events and extract associated garments
                if (todayData.TryGetProperty("events", out JsonElement eventsElement) && eventsElement.ValueKind == JsonValueKind.Array)
                {
                    result.EventCount = eventsElement.GetArrayLength();

                    // Process each event to extract associated garments
                    foreach (JsonElement eventElement in eventsElement.EnumerateArray())
                    {
                        if (eventElement.TryGetProperty("associatedGarments", out JsonElement associatedGarmentsElement) 
                            && associatedGarmentsElement.ValueKind == JsonValueKind.Object)
                        {
                            // Only look for today's date in associatedGarments
                            if (associatedGarmentsElement.TryGetProperty(todayDateKey, out JsonElement todayGarmentsElement)
                                && todayGarmentsElement.ValueKind == JsonValueKind.Array)
                            {
                                // Check each garment for today and count by type
                                foreach (JsonElement garment in todayGarmentsElement.EnumerateArray())
                                {
                                    if (garment.TryGetProperty("type", out JsonElement typeElement)
                                        && garment.TryGetProperty("id", out JsonElement idElement))
                                    {
                                        string? garmentType = typeElement.GetString();
                                        
                                        if (int.TryParse(idElement.GetRawText(), out int garmentId))
                                        {
                                            if (garmentType == "item")
                                            {
                                                result.ItemCount++;
                                                // Update item wear count from event-associated garments
                                                try
                                                {
                                                    await itemService.UpdateItemWearCount(garmentId);
                                                }
                                                catch (Exception ex)
                                                {
                                                    _logger.LogWarning(ex, "Failed to update wear count for event-associated item {ItemId}", garmentId);
                                                }
                                            }
                                            else if (garmentType == "outfit")
                                            {
                                                result.OutfitCount++;
                                                // Update outfit wear count from event-associated garments
                                                try
                                                {
                                                    await outfitService.UpdateOutfitWearCount(garmentId);
                                                }
                                                catch (Exception ex)
                                                {
                                                    _logger.LogWarning(ex, "Failed to update wear count for event-associated outfit {OutfitId}", garmentId);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error extracting calendar counts");
            }

            return result;
        }

        private async Task<List<User>> GetUsersWithTodayCalendarAsync(CalendarService calendarService)
        {
            try
            {
                _logger.LogInformation("Retrieving all users' calendar data...");

                // Get today's date in YYYY-MM-DD format
                string todayDateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");
                _logger.LogInformation("Today's date key: {DateKey}", todayDateKey);

                var allCalendars = await calendarService.GetAllUserCalendarsAsync();
                
                _logger.LogInformation("Retrieved {Count} calendar records", allCalendars.Count);

                var usersWithTodayCalendar = new List<User>();

                foreach (var calendar in allCalendars)
                {
                    if (!IsValidCalendarTemplate(calendar.JsonTemplate, out var jsonObject))
                    {
                        _logger.LogWarning("Invalid calendar template for user {UserId}: template is null, empty, or '{{}}'", calendar.UserId);
                        continue;
                    }

                    if (HasTodayCalendarData(jsonObject, todayDateKey))
                    {
                        _logger.LogInformation("User {UserId} has valid calendar data for today ({DateKey})", calendar.UserId, todayDateKey);
                        usersWithTodayCalendar.Add(calendar.User);
                    }
                    else
                    {
                        _logger.LogDebug("User {UserId} does not have calendar data for today", calendar.UserId);
                    }
                }

                _logger.LogInformation("Found {Count} users with valid calendar data for today", usersWithTodayCalendar.Count);
                return usersWithTodayCalendar;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users' calendar data");
                throw;
            }
        }

        private bool IsValidCalendarTemplate(string jsonTemplate, out JsonElement jsonObject)
        {
            jsonObject = default;

            if (string.IsNullOrWhiteSpace(jsonTemplate))
            {
                _logger.LogDebug("Calendar template is null or empty");
                return false;
            }

            if (jsonTemplate.Trim() == "{}")
            {
                _logger.LogDebug("Calendar template is empty object {{}}");
                return false;
            }

            try
            {
                using (JsonDocument doc = JsonDocument.Parse(jsonTemplate))
                {
                    jsonObject = doc.RootElement.Clone();
                    return true;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid JSON format in calendar template");
                return false;
            }
        }

        private bool HasTodayCalendarData(JsonElement jsonObject, string todayDateKey)
        {
            try
            {
                JsonElement calendarData = jsonObject;
                
                if (jsonObject.TryGetProperty("calendarData", out JsonElement calendarDataProp))
                {
                    calendarData = calendarDataProp;
                    _logger.LogDebug("Found 'calendarData' property");
                }

                if (calendarData.TryGetProperty(todayDateKey, out JsonElement todayData))
                {
                    if (HasValidDayStructure(todayData))
                    {
                        _logger.LogDebug("Found valid calendar structure for date {DateKey}", todayDateKey);
                        return true;
                    }
                    else
                    {
                        _logger.LogDebug("Date {DateKey} exists but has invalid structure", todayDateKey);
                        return false;
                    }
                }
                else
                {
                    _logger.LogDebug("Date key {DateKey} not found in calendar", todayDateKey);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking for today's calendar data");
                return false;
            }
        }

        private bool HasValidDayStructure(JsonElement dayData)
        {
            try
            {
                bool hasItems = dayData.TryGetProperty("items", out _);
                bool hasOutfit = dayData.TryGetProperty("outfit", out _);
                bool hasEvents = dayData.TryGetProperty("events", out _);

                if (!(hasItems && hasOutfit && hasEvents))
                {
                    _logger.LogDebug("Missing required properties in day structure");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error validating day structure");
                return false;
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Calendar Check Service is stopping.");
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
