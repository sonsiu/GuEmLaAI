using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.ResponseModels.Board;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GuEmLaAI.BusinessObjects.RequestModels.Outfit;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OutfitController : Controller
    {
        private readonly OutfitService _outfitService;

        public OutfitController(OutfitService outfitService)
        {
            _outfitService = outfitService;
        }

        [HttpGet("{userId}/outfits")]
        public async Task<IActionResult> GetOutfitsByUser(int userId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 12, 
            [FromQuery] string? searchQuery = null,
            [FromQuery] bool? isFavorite = null)
        {
            try
            {
                var (outfits, totalOutfits, totalPages) = await _outfitService.GetOutfitsByUserAsync(userId, pageNumber, pageSize, searchQuery, isFavorite);

                return Ok(new
                {
                    data = outfits,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalOutfits = totalOutfits,
                        totalPages = totalPages,
                        hasNextPage = pageNumber < totalPages,
                        hasPreviousPage = pageNumber > 1
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOutfit(int id)
        {
            try
            {
                var outfit = await _outfitService.GetOutfitAsync(id);
                if (outfit == null)
                    return NotFound(new { error = "Outfit not found" });

                return Ok(outfit);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }


        [HttpGet("{id}/image")]
        public async Task<IActionResult> GetOutfitImage(int id)
        {
            try
            {
                var outfit = await _outfitService.GetOutfitAsync(id);
                if (outfit == null)
                    return NotFound(new { error = "Item not found" });

                return Ok(new
                {
                    src = outfit.ImageUrl,
                    name = outfit.ImagePreview,
                    outfitId = id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOutfit([FromForm] OutfitCreateRequest request)
        {
            try
            {
                var outfitId = await _outfitService.CreateOutfitAsync(request.UserId, request, request.ImageFile);
                return Ok(new { outfitId = outfitId });
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

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateOutfitName(int id, [FromBody] UpdateOutfitNameRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.Name))
                    return BadRequest();

                var success = await _outfitService.UpdateOutfitAsync(id, new OutfitUpdateRequest { Name = request.Name, IsFavorite = request.IsFavorite, Seasons = request.Seasons });
                if (!success)
                    return NotFound();

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        public class UpdateOutfitNameRequest
        {
            public string Name { get; set; } = string.Empty;
            public List<string>? Seasons { get; set; }
            public bool? IsFavorite { get; set; } = false;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOutfit(int id)
        {
            try
            {
                var success = await _outfitService.DeleteOutfitAsync(id);
                if (!success)
                    return NotFound(new { error = "Outfit not found" });

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Save a try-on result from HistoryBoard as an outfit
        /// </summary>
        [HttpPost("save-from-tryon")]
        public async Task<IActionResult> SaveOutfitFromTryOn([FromBody] SaveTryOnOutfitRequest request)
        {
            try
            {
                // Get current user ID from JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                //if (request.HistoryBoardId <= 0)
                //{
                //    return BadRequest(new { error = "Invalid HistoryBoard ID" });
                //}

                var outfitId = await _outfitService.SaveOutfitFromHistoryBoardAsync(userId, request);

                return Ok(new
                {
                    outfitId = outfitId,
                   // message = "Outfit saved successfully from try-on result"
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
    }
}
