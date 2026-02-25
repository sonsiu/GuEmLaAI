using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.ResponseModels.Calendar;
using System.Security.Claims;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.OData.Query;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly CalendarService _calendarService;
        private readonly WasabiS3Service _wasabiS3Service;

        public CalendarController(CalendarService calendarService, WasabiS3Service wasabiS3Service)
        {
            _calendarService = calendarService;
            _wasabiS3Service = wasabiS3Service;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateCalendarDay([FromBody] CreateCalendarDayRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized(new { error = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(request.JsonTemplate))
                    return BadRequest(new { error = "JsonTemplate is required" });

                var calendarDay = await _calendarService.CreateCalendarDayAsync(
                    userId,
                    request.JsonTemplate
                );

                if (calendarDay == null)
                    return BadRequest(new { error = "Failed to create calendar day" });

                return Ok(new
                {
                    data = calendarDay,
                    message = "Calendar day created successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("usedItemsInCalendar")]
        public async Task<IActionResult> GetItemsUsedInCalendar()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized(new { error = "User not authenticated" });

                // Get all items used in the calendar (from items array, outfits, and events)
                var items = await _calendarService.GetItemsInCalendarAsync(userId);

                if (items == null || items.Count == 0)
                    return NotFound(new { error = "No items found in calendar" });

                // Map items to response model with presigned URLs
                var itemResponses = items.Select(item => new
                {
                    id = item.Id,
                    name = item.Comment,
                    categoryCode = item.CategoryCode,
                    imageFilename = item.ImagePreview,
                    imageUrl = _wasabiS3Service.GetPreSignedUrl(item.ImagePreview, WasabiImageFolder.items),
                    colors = item.ItemColors?.Select(c => c.ColorName).ToList() ?? new List<string>(),
                    seasons = item.ItemSeasons?.Select(s => s.SeasonName).ToList() ?? new List<string>(),
                    occasions = item.ItemOccasions?.Select(o => o.OccasionName).ToList() ?? new List<string>(),
                }).ToList();

                return Ok(new
                {
                    data = itemResponses,
                    count = itemResponses.Count,
                    message = $"Retrieved {itemResponses.Count} items used in calendar"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("my-calendar-days")]
        public async Task<IActionResult> GetMyCalendarDays()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized(new { error = "User not authenticated" });

                var calendarDay = await _calendarService.GetUserCalendarDaysAsync(userId);

                if (calendarDay == null)
                    return NotFound(new { error = "No calendar days found" });

                // Inject fresh presigned URLs into the calendar JSON
                var updatedJsonTemplate = InjectPresignedUrlsIntoCalendarTemplate(calendarDay.JsonTemplate);

                return Ok(new
                {
                    calendarJson = updatedJsonTemplate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }


        [HttpPut("update-calendar")]
        public async Task<IActionResult> UpdateCalendarDay([FromBody] UpdateCalendarDayRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized(new { error = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(request.JsonTemplate))
                    return BadRequest(new { error = "JsonTemplate is required" });

                var calendarDay = await _calendarService.UpdateCalendarDayAsync(
                    userId,
                    request.JsonTemplate
                );

                if (calendarDay == null)
                    return NotFound(new { error = "Calendar day not found or access denied" });

                var updatedJsonTemplate = InjectPresignedUrlsIntoCalendarTemplate(calendarDay.JsonTemplate);

                return Ok(new
                {
                    calendarJson = updatedJsonTemplate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("associated-items-from-outfits")]
        public async Task<IActionResult> GetAssociatedItemsFromOutfits([FromQuery] int outfitId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var outfitWithItems = await _calendarService.GetAssociatedItemsFromCalendarWithPresignedUrlsAsync(userId, outfitId, _wasabiS3Service);

                if (outfitWithItems == null)
                    return NotFound(new { error = "Outfit not found or has no template" });

                return Ok(new
                {
                    data = outfitWithItems,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }


        //[HttpGet("today-data-all-users")]
        //[AllowAnonymous]
        //public async Task<IActionResult> GetAllUsersTodayCalendarData()
        //{
        //    try
        //    {
        //        var todayCalendarDataList = await _calendarService.GetAllUsersTodayCalendarDataAsync();

        //        if (todayCalendarDataList == null || todayCalendarDataList.Count == 0)
        //            return Ok(new { data = new List<object>(), message = "No calendar data found for today" });

        //        // Inject presigned URLs into each user's calendar data
        //        var enrichedData = new List<object>();
        //        foreach (var calendarData in todayCalendarDataList)
        //        {
        //            var enrichedJson = InjectPresignedUrlsIntoTodayData(calendarData.Json);
        //            enrichedData.Add(new
        //            {
        //                userId = calendarData.UserId,
        //                dateId = calendarData.DateId,
        //                json = enrichedJson
        //            });
        //        }

        //        return Ok(new
        //        {
        //            data = enrichedData,
        //            count = enrichedData.Count,
        //            message = $"Retrieved today's calendar data for {enrichedData.Count} users"
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
        //    }
        //}

        /// <summary>
        /// Injects presigned URLs into today's calendar data (items and outfit only, without date wrapper)
        /// </summary>
        private string InjectPresignedUrlsIntoTodayData(string todayJson)
        {
            try
            {
                var jsonObject = JsonNode.Parse(todayJson);
                if (jsonObject == null) 
                {
                    return todayJson;
                }

                // Process items array
                var itemsArray = jsonObject["items"]?.AsArray();
                if (itemsArray != null)
                {
                    foreach (var item in itemsArray)
                    {
                        if (item == null) continue;
                        InjectPresignedUrlForImageObject(item, WasabiImageFolder.items);
                    }
                }

                // Process outfit object
                var outfitObject = jsonObject["outfit"];
                if (outfitObject != null && outfitObject["id"] != null)
                {
                    InjectPresignedUrlForImageObject(outfitObject, WasabiImageFolder.items);
                }

                // Process events array with associated garments
                var eventsArray = jsonObject["events"]?.AsArray();
                if (eventsArray != null)
                {
                    foreach (var eventItem in eventsArray)
                    {
                        if (eventItem == null) continue;
                        
                        // Process associatedGarments if present
                        var associatedGarmentsObject = eventItem["associatedGarments"];
                        if (associatedGarmentsObject != null)
                        {
                            // Iterate through each date in associatedGarments
                            foreach (var dateEntry in associatedGarmentsObject.AsObject())
                            {
                                var garmentsArray = dateEntry.Value?.AsArray();
                                if (garmentsArray != null)
                                {
                                    foreach (var garment in garmentsArray)
                                    {
                                        if (garment == null) continue;

                                        // Determine the folder based on the "type" field
                                        var garmentType = garment["type"]?.GetValue<string>();
                                        var imageFilename = garment["imageFilename"]?.GetValue<string>();

                                        if (!string.IsNullOrEmpty(imageFilename) && !string.IsNullOrEmpty(garmentType))
                                        {
                                            WasabiImageFolder folder = garmentType.ToLower() switch
                                            {
                                                "item" => WasabiImageFolder.items,
                                                "outfit" => WasabiImageFolder.items,
                                                _ => WasabiImageFolder.items // default to items
                                            };

                                            InjectPresignedUrlForImageObject(garment, folder);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                var result = jsonObject.ToJsonString();
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in InjectPresignedUrlsIntoTodayData: {ex.Message}");
                return todayJson;
            }
        }

        private string InjectPresignedUrlsIntoCalendarTemplate(string jsonTemplate)
        {
            try
            {
                var jsonObject = JsonNode.Parse(jsonTemplate);
                if (jsonObject == null) return jsonTemplate;

                // Iterate through all date entries in the calendar
                foreach (var dateEntry in jsonObject.AsObject())
                {
                    var dateData = dateEntry.Value;
                    if (dateData == null) continue;

                    // Process items array
                    var itemsArray = dateData["items"]?.AsArray();
                    if (itemsArray != null)
                    {
                        foreach (var item in itemsArray)
                        {
                            if (item == null) continue;
                            InjectPresignedUrlForImageObject(item, WasabiImageFolder.items);
                        }
                    }

                    // Process outfit object
                    var outfitObject = dateData["outfit"];
                    if (outfitObject != null && outfitObject["id"] != null)
                    {
                        InjectPresignedUrlForImageObject(outfitObject, WasabiImageFolder.items);
                    }

                    // Process events array with associated garments
                    var eventsArray = dateData["events"]?.AsArray();
                    if (eventsArray != null)
                    {
                        foreach (var eventItem in eventsArray)
                        {
                            if (eventItem == null) continue;
                            
                            // Process associatedGarments if present
                            var associatedGarmentsObject = eventItem["associatedGarments"];
                            if (associatedGarmentsObject != null)
                            {
                                // Iterate through each date in associatedGarments
                                foreach (var garmentDateEntry in associatedGarmentsObject.AsObject())
                                {
                                    var garmentsArray = garmentDateEntry.Value?.AsArray();
                                    if (garmentsArray != null)
                                    {
                                        foreach (var garment in garmentsArray)
                                        {
                                            if (garment == null) continue;

                                            // Determine the folder based on the "type" field
                                            var garmentType = garment["type"]?.GetValue<string>();
                                            var imageFilename = garment["imageFilename"]?.GetValue<string>();

                                            if (!string.IsNullOrEmpty(imageFilename) && !string.IsNullOrEmpty(garmentType))
                                            {
                                                WasabiImageFolder folder = garmentType.ToLower() switch
                                                {
                                                    "item" => WasabiImageFolder.items,
                                                    "outfit" => WasabiImageFolder.items,
                                                    _ => WasabiImageFolder.items // default to items
                                                };

                                                InjectPresignedUrlForImageObject(garment, folder);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                return jsonObject.ToJsonString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in InjectPresignedUrlsIntoCalendarTemplate: {ex.Message}");
                return jsonTemplate;
            }
        }

        private void InjectPresignedUrlForImageObject(JsonNode? imageObject, WasabiImageFolder folder)
        {
            if (imageObject == null) 
            {
                Console.WriteLine($"[DEBUG] InjectPresignedUrlForImageObject - imageObject is NULL for folder: {folder}");
                return;
            }

            var imageFilename = imageObject["imageFilename"]?.GetValue<string>();

            if (!string.IsNullOrEmpty(imageFilename))
            {
                try
                {

                    var freshPresignedUrl = _wasabiS3Service.GetPreSignedUrl(
                        imageFilename,
                        folder
                    );

                    if (string.IsNullOrEmpty(freshPresignedUrl))
                    {
                        Console.WriteLine($"[DEBUG] WARNING: GetPreSignedUrl returned empty URL for {imageFilename}");
                    }

                    imageObject["imageUrl"] = freshPresignedUrl;

                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG] ERROR generating presigned URL for {imageFilename}: {ex.Message}");
                    Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"[DEBUG] imageFilename is NULL or EMPTY for folder {folder} - skipping URL generation");
            }

        }
    }

    public class CreateCalendarDayRequest
    {
        public string JsonTemplate { get; set; } = null!;
    }
    public class UpdateCalendarDayRequest
    {
        public string JsonTemplate { get; set; } = null!;
    }

    public class EnsureCalendarDayRequest
    {
        public string? DefaultJsonTemplate { get; set; }
    }


}
