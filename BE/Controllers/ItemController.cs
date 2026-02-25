using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Item;
using GuEmLaAI.Hubs;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ItemController : ControllerBase
    {
        private readonly ItemService _itemService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly GuEmLaAiContext _context;

        public ItemController(ItemService itemService,
            IHubContext<NotificationHub> hubContext,
            GuEmLaAiContext context
            )
        {
            _itemService = itemService;
            _hubContext = hubContext;
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
                {
                    return parsedUserId;
                }
            }
            return null;
        }

        [HttpGet("{userId}/items")]
        public async Task<IActionResult> GetItemsByUser(
            int userId, 
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 8,  // Changed from 8 to 12 to match service default
            [FromQuery] string? category = null,
            [FromQuery] string? colors = null,
            [FromQuery] string? occasions = null,
            [FromQuery] string? sizes = "S",
            [FromQuery] string? seasons = null,
            [FromQuery] bool? isFavorite = null,
            [FromQuery] bool? isPublic = null,
            [FromQuery] string? searchQuery = null
        )
        {
            try
            {
                // Parse comma-separated values into arrays
                var colorList = colors?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(c => c.Trim())
                    .ToList() ?? new List<string>();
                
                var occasionList = occasions?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(o => o.Trim())
                    .ToList() ?? new List<string>();
                
                //var sizeList = sizes?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                //    .Select(s => s.Trim())
                //    .ToList() ?? new List<string>();
                
                var seasonList = seasons?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .ToList() ?? new List<string>();

                // Call service method with filter parameters
                var (items, totalItems, totalPages) = await _itemService.GetItemsByUserAsync(
                    userId, 
                    pageNumber, 
                    pageSize,
                    category: category?.Trim(),
                    colors: colorList,
                    occasions: occasionList,
                    //sizes: sizeList,
                    seasons: seasonList,
                    isFavorite: isFavorite,
                    //isPublic: isPublic,
                    searchQuery: searchQuery?.Trim()
                );

                return Ok(new
                {
                    data = items,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalItems = totalItems,
                        totalPages = totalPages,
                        hasNextPage = pageNumber < totalPages,
                        hasPreviousPage = pageNumber > 1
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetItem(int id)
        {
            try
            {
                var item = await _itemService.GetItemAsync(id);
                //if (item == null)
                //    return NotFound();

                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}/image")]
        public async Task<IActionResult> GetItemImage(int id)
        {
            try
            {
                var item = await _itemService.GetItemAsync(id);
                if (item == null)
                    return NotFound();

                return Ok(new
                {
                    src = item.ImageUrl,          
                    name = item.ImagePreview,      
                    itemId = id                   
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }



        [HttpPost("create")]
        public async Task<IActionResult> CreateItem([FromForm] ItemCreateRequest request)
        {
            try
            {
                var itemId = await _itemService.CreateItemAsync(request.UserId, request, request.ImageFile);
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

       // [HttpGet("/public")]
       // public async Task<IActionResult> GetPublicItems(
       //    int userId,
       //    [FromQuery] int pageNumber = 1,
       //    [FromQuery] int pageSize = 6,
       //    [FromQuery] string? category = null,
       //    [FromQuery] string? colors = null,
       //    [FromQuery] string? occasions = null,
       //    [FromQuery] string? sizes = null,
       //    [FromQuery] string? seasons = null,
       //    [FromQuery] bool? isFavorite = null,
       //    [FromQuery] bool? isPublic = null,
       //    [FromQuery] string? searchQuery = null
       //)
       // {
       //     try
       //     {
       //         // Parse comma-separated values into arrays
       //         var colorList = colors?.Split(',', StringSplitOptions.RemoveEmptyEntries)
       //             .Select(c => c.Trim())
       //             .ToList() ?? new List<string>();

       //         var occasionList = occasions?.Split(',', StringSplitOptions.RemoveEmptyEntries)
       //             .Select(o => o.Trim())
       //             .ToList() ?? new List<string>();

       //         var sizeList = sizes?.Split(',', StringSplitOptions.RemoveEmptyEntries)
       //             .Select(s => s.Trim())
       //             .ToList() ?? new List<string>();

       //         var seasonList = seasons?.Split(',', StringSplitOptions.RemoveEmptyEntries)
       //             .Select(s => s.Trim())
       //             .ToList() ?? new List<string>();

       //         // Call service method with filter parameters
       //         var (items, totalItems, totalPages) = await _itemService.GetItemsByUserAsync(
       //             userId,
       //             pageNumber,
       //             pageSize,
       //             category: category?.Trim(),
       //             colors: colorList,
       //             occasions: occasionList,
       //             sizes: sizeList,
       //             seasons: seasonList,
       //             isFavorite: isFavorite,
       //             isPublic: isPublic,
       //             searchQuery: searchQuery?.Trim()
       //         );

       //         return Ok(new
       //         {
       //             data = items,
       //             pagination = new
       //             {
       //                 currentPage = pageNumber,
       //                 pageSize = pageSize,
       //                 totalItems = totalItems,
       //                 totalPages = totalPages,
       //                 hasNextPage = pageNumber < totalPages,
       //                 hasPreviousPage = pageNumber > 1
       //             }
       //         });
       //     }
       //     catch (ArgumentException ex)
       //     {
       //         return BadRequest(new { error = ex.Message });
       //     }
       //     catch (Exception ex)
       //     {
       //         return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
       //     }
       // }

       // [HttpPost("createPublic")]
       // public async Task<IActionResult> CreateItemPublic([FromForm] ItemCreateRequest request)
       // {
       //     try
       //     {
       //         var itemId = await _itemService.CreateItemPublicAsync(request, request.ImageFile);
       //         return Ok(new { itemId = itemId, message = "Item created successfully" });
       //     }
       //     catch (ArgumentException ex)
       //     {
       //         return BadRequest(new { error = ex.Message });
       //     }
       //     catch (Exception ex)
       //     {
       //         return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
       //     }
       // }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateItem(int id, [FromForm] ItemUpdateRequest request)
        {
            try
            {
                var success = await _itemService.UpdateItemAsync(id, request);
                if (!success)
                    return NotFound(new { error = "Item not found" });

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            try
            {
                var success = await _itemService.DeleteItemAsync(id);
                if (!success)
                    return NotFound(new { error = "Item not found" });

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("generateCleanGarment")]
        public async Task<IActionResult> GenerateCleanGarment([FromBody] CleanGarmentRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { error = "User not authenticated." });
            }

            var user = await _context.Users.FindAsync(userId.Value);

            if (string.IsNullOrWhiteSpace(request.ImageBase64))
            {
                return BadRequest(new { error = "ImageBase64 is required." });
            }

            //Check for daily limit
            if (user != null && user.TodayItemGeneratedCount >= user.MaxItemGenerated)
            {
                return BadRequest(new { error = "Daily item generation limit reached." });
            }

            try
            {
                var result = await _itemService.GenerateCleanGarmentAsync(request.ImageBase64, request.ConstraintsJson);

                user.TodayItemGeneratedCount = (user.TodayItemGeneratedCount ?? 0) + 1;
                await _hubContext.Clients.Group($"user_{userId}")
                  .SendAsync("ReceiveItemGenerationCountUpdate", new
                  {
                      count = user?.TodayItemGeneratedCount ?? 0,
                      timestamp = DateTime.UtcNow,
                      type = "item_generation",
                  });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    imageBase64 = result.finalResult,
                    name = result.name,
                    colors = result.colors,
                    categories = result.categories,
                    sizes = result.sizes,
                    seasons = result.seasons,
                    occasions = result.occasions,
                    description = result.description,
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("remove-background")]
        public async Task<IActionResult> RemoveBackground([FromForm] RemoveBackgroundRequest request)
        {
            try
            {
                var processedImageBase64 = await _itemService.RemoveBackgroundAsync(request.ImageFile, request.ImageUrl);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        imageBase64 = processedImageBase64,
                        format = "image/png",
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex) when (ex.Message.Contains("timed out"))
            {
                return StatusCode(504, new { error = ex.Message });
            }
            catch (Exception ex) when (ex.Message.Contains("Replicate API error"))
            {
                return StatusCode(502, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("wardrobe/wear-statistics")]
        public async Task<IActionResult> GetWardrobeWearStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();

                var wearStats = await _context.Items
                    .Include(i => i.ItemColors)
                    .Where(i => i.UserId == userId.Value)
                    .Select(i => new
                    {
                        i.Id,
                        i.Comment,
                        i.CategoryCode,
                        i.WearCount,
                        colors = i.ItemColors.Select(c => c.ColorName).ToList()
                    })
                    .OrderByDescending(i => i.WearCount)
                    .ToListAsync();

                //Console.WriteLine($"Wear statistics retrieved: {JsonSerializer.Serialize(wearStats)}");

                return Ok(new 
                { 
                    success = true, 
                    data = wearStats,
                    totalItems = wearStats.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class CleanGarmentRequest
        {
            public string ImageBase64 { get; set; } = string.Empty;
            public object? ConstraintsJson { get; set; }
        }

        public class RemoveBackgroundRequest
        {
            public int UserId { get; set; }
            public IFormFile? ImageFile { get; set; }
            public string? ImageUrl { get; set; }
            public bool SaveProcessedImage { get; set; } = false;
        }
    }
}
