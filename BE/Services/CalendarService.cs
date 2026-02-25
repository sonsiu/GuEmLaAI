using AutoMapper;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.ResponseModels.Calendar;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GuEmLaAI.Services
{
    public class CalendarService
    {
        private readonly GuEmLaAiContext _context;
        private readonly EmailService _emailService;
        private readonly NotificationService _notificationService;
        private readonly OutfitService _outfitService;
        public CalendarService(
          GuEmLaAiContext context,
          EmailService emailService,
          NotificationService notificationService,
          OutfitService outfitService)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
            _outfitService = outfitService;
        }

        public async Task<CalendarDay?> CreateCalendarDayAsync(int userId, string jsonTemplate)
        {
            // Validate parameters before attempting to create
            if (string.IsNullOrEmpty(jsonTemplate))
            {
                throw new ArgumentNullException(nameof(jsonTemplate), "JSON template cannot be null or empty");
            }

            try
            {
                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists)
                {
                    throw new InvalidOperationException($"User with ID {userId} does not exist");
                }

                var calendarDay = new CalendarDay
                {
                    UserId = userId,
                    JsonTemplate = jsonTemplate,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CalendarDays.Add(calendarDay);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Calendar day created successfully for user {userId}");
                return calendarDay;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating calendar day: {ex.Message}");
                throw;
            }
        }

        public async Task<CalendarDay?> UpdateCalendarDayAsync(int userId, string jsonTemplate)
        {
            try
            {
                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists)
                {
                    return null;
                }

                // Get existing calendar day without auto-creating
                var calendarDay = await _context.CalendarDays
                    .Where(cd => cd.UserId == userId)
                    .OrderByDescending(cd => cd.CreatedAt)
                    .FirstOrDefaultAsync();

                if (calendarDay == null)
                {
                    // Return null instead of creating - let caller decide
                    return null;
                }

                calendarDay.JsonTemplate = jsonTemplate;
                calendarDay.UpdatedAt = DateTime.UtcNow;

                _context.CalendarDays.Update(calendarDay);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Calendar day {calendarDay.Id} updated successfully");
                return calendarDay;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating calendar day: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> DeleteCalendarDayAsync(int calendarDayId, int userId)
        {
            try
            {
                var calendarDay = await _context.CalendarDays
                    .FirstOrDefaultAsync(cd => cd.Id == calendarDayId && cd.UserId == userId);

                if (calendarDay == null)
                {
                    Console.WriteLine($"Calendar day with ID {calendarDayId} not found for user {userId}");
                    return false;
                }

                _context.CalendarDays.Remove(calendarDay);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Calendar day {calendarDayId} deleted successfully");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting calendar day: {ex.Message}");
                return false;
            }
        }

        public async Task<CalendarDay?> GetUserCalendarDaysAsync(int userId)
        {
            try
            {
                var calendarDay = await _context.CalendarDays
                    .Where(cd => cd.UserId == userId)
                    .OrderByDescending(cd => cd.CreatedAt)
                    .FirstOrDefaultAsync();

                // If user doesn't have a calendar row, create one with empty JSON
                if (calendarDay == null)
                {
                    calendarDay = await EnsureUserCalendarDayExistsAsync(userId, "{}");
                }

                //var updatedCalendarDay = await InjectAssociatedGarmentToOutfitsAsync(calendarDay);

                return calendarDay;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user calendar days: {ex.Message}");
                return null;
            }
        }

        public async Task<List<Item>> GetItemsInCalendarAsync(int userId)
        {
            try
            {
                var calendarDay = await _context.CalendarDays
                    .Where(cd => cd.UserId == userId)
                    .OrderByDescending(cd => cd.CreatedAt)
                    .FirstOrDefaultAsync();

                if (calendarDay == null)
                {
                    Console.WriteLine($"Calendar day not found for user {userId}");
                    return new List<Item>();
                }

                var items = await GetAllItemsFromCalendarJsonAsync(userId, calendarDay.JsonTemplate);
                return items;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting items in calendar: {ex.Message}");
                return new List<Item>();
            }
        }

        public async Task<OutfitWithAssociatedItemsResponse?> GetAssociatedItemsFromCalendar(int userId, int outfitId)
        {
            try
            {
                var outfit = await _context.Outfits
                    .Include(o => o.OutfitImages)
                    .FirstOrDefaultAsync(o => o.Id == outfitId && o.UserId == userId);

                if (outfit == null)
                {
                    Console.WriteLine($"Outfit with ID {outfitId} not found for user {userId}");
                    return null;
                }

                if (string.IsNullOrEmpty(outfit.JsonTemplate))
                {
                    Console.WriteLine($"Outfit {outfitId} has no JSON template");
                    return null;
                }

                // Parse JSON template and extract items
                var associatedItems = ParseItemsFromJsonTemplate(outfit.JsonTemplate);

                // Extract pose images from OutfitImages
                var poseImages = outfit.OutfitImages != null && outfit.OutfitImages.Any()
                    ? outfit.OutfitImages
                        .Where(oi => !string.IsNullOrEmpty(oi.ImageName))
                        .Select(oi => oi.ImageName)
                        .ToList()
                    : new List<string>();

                // Build response with outfit info, associated items, and pose images
                var result = new OutfitWithAssociatedItemsResponse
                {
                    Id = outfit.Id,
                    Name = outfit.Name,
                    ImageFileName = outfit.ImagePreview,
                    //ImageUrl = outfit.ImagePreview,
                    AssociatedItems = associatedItems,
                    PoseImages = poseImages
                };

                Console.WriteLine($"Retrieved {associatedItems.Count} associated items and {poseImages.Count} pose images for outfit {outfitId}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting associated items from calendar: {ex.Message}");
                return null;
            }
        }

        private List<AssociatedItemsResponse> ParseItemsFromJsonTemplate(string jsonTemplate)
        {
            var items = new List<AssociatedItemsResponse>();

            try
            {
                using (JsonDocument document = JsonDocument.Parse(jsonTemplate))
                {
                    JsonElement root = document.RootElement;

                    // Check if "objects" array exists
                    if (root.TryGetProperty("objects", out JsonElement objectsArray))
                    {
                        foreach (var obj in objectsArray.EnumerateArray())
                        {
                            // Extract required attributes
                            if (obj.TryGetProperty("itemId", out JsonElement itemIdProp) &&
                                obj.TryGetProperty("name", out JsonElement nameProp) &&
                                obj.TryGetProperty("src", out JsonElement srcProp))
                            {
                                var itemId = itemIdProp.GetInt32();
                                var name = nameProp.GetString();
                                var imageFileName = srcProp.GetString();

                                // Create AssociatedItemsResponse object
                                var item = new AssociatedItemsResponse
                                {
                                    Id = itemId,
                                    Name = name,
                                    ImageFileName = imageFileName,
                                    ImageUrl = imageFileName // Placeholder - presigned URL to be injected later
                                };

                                items.Add(item);
                            }
                        }
                    }
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error parsing JSON template: {ex.Message}");
            }

            return items;
        }

        public async Task<OutfitWithAssociatedItemsResponse?> GetAssociatedItemsFromCalendarWithPresignedUrlsAsync(int userId, int outfitId, WasabiS3Service wasabiS3Service)
        {
            var result = await GetAssociatedItemsFromCalendar(userId, outfitId);
            
            if (result == null)
                return null;

            // Inject presigned URLs for outfit image
            //if (!string.IsNullOrEmpty(result.ImageFileName))
            //{
            //    result.ImageUrl = wasabiS3Service.GetPreSignedUrl(result.ImageFileName, WasabiImageFolder.items);
            //}

            // Inject presigned URLs for all associated items
            if (result.AssociatedItems != null && result.AssociatedItems.Count > 0)
            {
                foreach (var item in result.AssociatedItems)
                {
                    if (!string.IsNullOrEmpty(item.ImageFileName))
                    {
                        item.ImageUrl = wasabiS3Service.GetPreSignedUrl(item.ImageFileName, WasabiImageFolder.items);
                    }
                }
            }

            // Inject presigned URLs for all pose images
            if (result.PoseImages != null && result.PoseImages.Count > 0)
            {
                result.PoseImages = result.PoseImages
                    .Where(imageName => !string.IsNullOrEmpty(imageName))
                    .Select(imageName => wasabiS3Service.GetPreSignedUrl(imageName, WasabiImageFolder.items))
                    .ToList();
            }

            return result;
        }

        public async Task<bool> DeleteCalendarDayByDateAsync(int userId, DateTime date)
        {
            try
            {
                var calendarDay = await _context.CalendarDays
                    .FirstOrDefaultAsync(cd => cd.UserId == userId && cd.CreatedAt.Date == date.Date);

                if (calendarDay == null)
                {
                    Console.WriteLine($"Calendar day not found for user {userId} on {date.Date}");
                    return false;
                }

                _context.CalendarDays.Remove(calendarDay);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Calendar day for {date.Date} deleted successfully");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting calendar day by date: {ex.Message}");
                return false;
            }
        }

        public async Task<CalendarDay?> EnsureUserCalendarDayExistsAsync(int userId, string? defaultJsonTemplate = null)
        {
            try
            {
                // Check if user has any calendar day record
                var existingCalendarDay = await _context.CalendarDays
                    .FirstOrDefaultAsync(cd => cd.UserId == userId);

                if (existingCalendarDay != null)
                {
                    Console.WriteLine($"Calendar day already exists for user {userId}");
                    return existingCalendarDay;
                }

                // User doesn't have a calendar day, create one with default template
                var jsonTemplate = defaultJsonTemplate ?? "{}";
                var newCalendarDay = new CalendarDay
                {
                    UserId = userId,
                    JsonTemplate = jsonTemplate,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CalendarDays.Add(newCalendarDay);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Calendar day created for user {userId} with default template");
                return newCalendarDay;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error ensuring calendar day exists for user {userId}: {ex.Message}");
                return null;
            }
        }

        public async Task<List<TodayCalendarData>> GetAllUsersTodayCalendarDataAsync()
        {
            try
            {
                var result = new List<TodayCalendarData>();
                string todayDateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");

                var allCalendarDays = await _context.CalendarDays.ToListAsync();

                foreach (var calendarDay in allCalendarDays)
                {
                    if (string.IsNullOrEmpty(calendarDay.JsonTemplate))
                        continue;

                    if (calendarDay.JsonTemplate == "{}")
                        continue;

                    try
                    {
                        using (JsonDocument document = JsonDocument.Parse(calendarDay.JsonTemplate))
                        {
                            JsonElement root = document.RootElement;

                            // find today's data
                            if (root.TryGetProperty(todayDateKey, out JsonElement todayData))
                            {
                                result.Add(new TodayCalendarData
                                {
                                    UserId = calendarDay.UserId,
                                    DateId = todayDateKey,
                                    Json = todayData.GetRawText()
                                });
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        Console.WriteLine($"Error parsing JSON for user {calendarDay.UserId}: {ex.Message}");
                        continue;
                    }
                }

                Console.WriteLine($"Retrieved today's calendar data for {result.Count} users");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all users' today calendar data: {ex.Message}");
                return new List<TodayCalendarData>();
            }
        }

        public async Task<List<CalendarDay>> GetAllUserCalendarsAsync()
        {
            try
            {
                var allCalendars = await _context.CalendarDays
                    .Include(cd => cd.User)
                    .ToListAsync();

                Console.WriteLine($"Retrieved {allCalendars.Count} calendar records");
                return allCalendars;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all user calendars: {ex.Message}");
                return new List<CalendarDay>();
            }
        }

        public async Task<List<Item>> GetItemsFromOutfitAsync(int userId, int outfitId)
        {
            try
            {
                // Get the outfit
                var outfit = await _context.Outfits
                    .Include(o => o.OutfitImages)
                    .FirstOrDefaultAsync(o => o.Id == outfitId && o.UserId == userId);

                if (outfit == null)
                {
                    Console.WriteLine($"Outfit with ID {outfitId} not found for user {userId}");
                    return new List<Item>();
                }

                if (string.IsNullOrEmpty(outfit.JsonTemplate))
                {
                    Console.WriteLine($"Outfit {outfitId} has no JSON template");
                    return new List<Item>();
                }

                // Extract item IDs from the outfit's JSON template
                var itemIds = ExtractAllItemIdsFromOutfit(outfit.JsonTemplate);

                if (!itemIds.Any())
                {
                    Console.WriteLine($"No items found in outfit {outfitId}");
                    return new List<Item>();
                }

                // Fetch the actual Item objects from database
                var items = await _context.Items
                    .Include(i => i.ItemColors)
                    .Include(i => i.ItemSeasons)
                    .Include(i => i.ItemSizes)
                    .Include(i => i.ItemOccasions)
                    .Where(i => itemIds.Contains(i.Id) && i.UserId == userId)
                    .ToListAsync();

                Console.WriteLine($"Retrieved {items.Count} items from outfit {outfitId}");
                return items;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting items from outfit: {ex.Message}");
                return new List<Item>();
            }
        }

        private List<int> ExtractAllItemIdsFromOutfit(string jsonTemplate)
        {
            var itemIds = new List<int>();

            if (string.IsNullOrEmpty(jsonTemplate))
                return itemIds;

            try
            {
                using (JsonDocument document = JsonDocument.Parse(jsonTemplate))
                {
                    JsonElement root = document.RootElement;

                    // Check if "objects" array exists (Fabric.js template format)
                    if (root.TryGetProperty("objects", out JsonElement objectsArray))
                    {
                        foreach (var obj in objectsArray.EnumerateArray())
                        {
                            var type = obj.TryGetProperty("type", out JsonElement typeProp) 
                                ? typeProp.GetString() 
                                : null;

                            if (type == "Image")
                            {
                                if (obj.TryGetProperty("itemId", out JsonElement itemIdProp))
                                {
                                    if (int.TryParse(itemIdProp.GetRawText(), out int itemId) && !itemIds.Contains(itemId))
                                    {
                                        itemIds.Add(itemId);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error parsing JSON template: {ex.Message}");
            }

            return itemIds;
        }

        public async Task<List<Item>> GetAllItemsFromCalendarJsonAsync(int userId, string jsonTemplate)
        {
            try
            {
                if (string.IsNullOrEmpty(jsonTemplate))
                {
                    Console.WriteLine("JSON template is empty");
                    return new List<Item>();
                }

                var allItemIds = new HashSet<int>(); // Use HashSet to avoid duplicates
                var outfitIds = new HashSet<int>();

                // Parse the calendar JSON template
                using (JsonDocument document = JsonDocument.Parse(jsonTemplate))
                {
                    JsonElement root = document.RootElement;

                    // Iterate through each date entry in the calendar
                    foreach (var dateEntry in root.EnumerateObject())
                    {
                        var dateData = dateEntry.Value;

                        // 1. Extract item IDs from "items" array
                        if (dateData.TryGetProperty("items", out JsonElement itemsArray))
                        {
                            foreach (var item in itemsArray.EnumerateArray())
                            {
                                if (item.TryGetProperty("id", out JsonElement itemIdProp))
                                {
                                    if (int.TryParse(itemIdProp.GetRawText(), out int itemId))
                                    {
                                        allItemIds.Add(itemId);
                                    }
                                }
                            }
                        }

                        // 2. Extract outfit ID from "outfit" object
                        if (dateData.TryGetProperty("outfit", out JsonElement outfitObj))
                        {
                            if (outfitObj.ValueKind != JsonValueKind.Null &&
                                outfitObj.TryGetProperty("id", out JsonElement outfitIdProp))
                            {
                                if (int.TryParse(outfitIdProp.GetRawText(), out int outfitId))
                                {
                                    outfitIds.Add(outfitId);
                                }
                            }
                        }

                        // 3. Extract item IDs from events -> associatedGarments
                        if (dateData.TryGetProperty("events", out JsonElement eventsArray))
                        {
                            foreach (var eventItem in eventsArray.EnumerateArray())
                            {
                                if (eventItem.TryGetProperty("associatedGarments", out JsonElement associatedGarmentsObj))
                                {
                                    // associatedGarments is an object with date keys
                                    foreach (var garmentDateEntry in associatedGarmentsObj.EnumerateObject())
                                    {
                                        var garmentsArray = garmentDateEntry.Value;

                                        if (garmentsArray.ValueKind == JsonValueKind.Array)
                                        {
                                            foreach (var garment in garmentsArray.EnumerateArray())
                                            {
                                                if (garment.TryGetProperty("id", out JsonElement garmentIdProp))
                                                {
                                                    if (int.TryParse(garmentIdProp.GetRawText(), out int garmentId))
                                                    {
                                                        allItemIds.Add(garmentId);
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

                // 4. Get items from outfits and add their associated items
                foreach (var outfitId in outfitIds)
                {
                    var outfitItems = await GetItemsFromOutfitAsync(userId, outfitId);
                    foreach (var item in outfitItems)
                    {
                        allItemIds.Add(item.Id);
                    }
                }

                // 5. Fetch all Item objects from database with their relationships
                if (!allItemIds.Any())
                {
                    Console.WriteLine($"No items found in calendar template for user {userId}");
                    return new List<Item>();
                }

                var items = await _context.Items
                    .Include(i => i.ItemColors)
                    .Include(i => i.ItemSeasons)
                    .Include(i => i.ItemOccasions)
                    .Where(i => allItemIds.Contains(i.Id) && i.UserId == userId)
                    .ToListAsync();

                Console.WriteLine($"Retrieved {items.Count} total items from calendar template for user {userId}");
                return items;
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error parsing calendar JSON template: {ex.Message}");
                return new List<Item>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting items from calendar: {ex.Message}");
                return new List<Item>();
            }
        }
    }
}
