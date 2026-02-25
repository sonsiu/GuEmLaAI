using GuEmLaAI.BusinessObjects.RequestModels.PublicCollection;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicCollectionController : ControllerBase
    {
        private readonly PublicCollectionService _publicCollectionService;

        public PublicCollectionController(PublicCollectionService publicCollectionService)
        {
            _publicCollectionService = publicCollectionService;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }

        #region Public Endpoints (For All Users - Homepage)

        /// <summary>
        /// Get all active public outfits for homepage display
        /// </summary>
        [HttpGet("outfits")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicOutfits()
        {
            try
            {
                var outfits = await _publicCollectionService.GetAllPublicOutfitsAsync(activeOnly: true);
                return Ok(new { data = outfits });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get public outfit detail with items (for modal)
        /// </summary>
        [HttpGet("outfits/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicOutfitDetail(int id)
        {
            try
            {
                var outfit = await _publicCollectionService.GetPublicOutfitDetailAsync(id);
                if (outfit == null)
                    return NotFound(new { error = "Public outfit not found" });

                return Ok(outfit);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Save public outfit to user's wardrobe
        /// </summary>
        [HttpPost("outfits/{id}/save-to-wardrobe")]
        [Authorize]
        public async Task<IActionResult> SaveOutfitToWardrobe(int id, [FromBody] SavePublicOutfitToWardrobeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                request.PublicOutfitId = id;
                var outfitId = await _publicCollectionService.SavePublicOutfitToWardrobeAsync(userId.Value, request);

                return Ok(new
                {
                    outfitId = outfitId,
                    message = "Outfit saved to your wardrobe successfully"
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

        /// <summary>
        /// Save individual public item to user's wardrobe
        /// </summary>
        [HttpPost("items/{id}/save-to-wardrobe")]
        [Authorize]
        public async Task<IActionResult> SaveItemToWardrobe(int id, [FromBody] SavePublicItemToWardrobeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated" });

                request.PublicItemId = id;
                var itemId = await _publicCollectionService.SavePublicItemToWardrobeAsync(userId.Value, request);

                return Ok(new
                {
                    itemId = itemId,
                    message = "Item saved to your wardrobe successfully"
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

        #endregion

        #region Admin Endpoints (Outfit Management)

        /// <summary>
        /// [ADMIN] Get all public outfits (including inactive)
        /// </summary>
        [HttpGet("admin/outfits")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminGetAllOutfits()
        {
            try
            {
                // TODO: Check if user is admin
                // var role = User.FindFirst("Role")?.Value;
                // if (role != "1") return Forbid();

                var outfits = await _publicCollectionService.GetAllPublicOutfitsAsync(activeOnly: false);
                return Ok(new { data = outfits });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// [ADMIN] Get public outfit detail
        /// </summary>
        [HttpGet("admin/outfits/{id}")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminGetOutfitDetail(int id)
        {
            try
            {
                var outfit = await _publicCollectionService.GetPublicOutfitDetailAsync(id);
                if (outfit == null)
                    return NotFound(new { error = "Public outfit not found" });

                return Ok(outfit);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// [ADMIN] Create new public outfit
        /// </summary>
        [HttpPost("admin/outfits")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminCreateOutfit([FromForm] PublicOutfitCreateRequest request)
        {
            try
            {
                // TODO: Check if user is admin
                // var role = User.FindFirst("Role")?.Value;
                // if (role != "1") return Forbid();

                var outfitId = await _publicCollectionService.CreatePublicOutfitAsync(request);
                
                // Get the created outfit with items to return
                var createdOutfit = await _publicCollectionService.GetPublicOutfitDetailAsync(outfitId);

                return Ok(new
                {
                    outfitId = outfitId,
                    message = "Public outfit created successfully",
                    data = createdOutfit
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

        /// <summary>
        /// [ADMIN] Update public outfit
        /// </summary>
        [HttpPut("admin/outfits/{id}")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminUpdateOutfit(int id, [FromForm] PublicOutfitUpdateRequest request)
        {
            try
            {
                var success = await _publicCollectionService.UpdatePublicOutfitAsync(id, request);
                if (!success)
                    return NotFound(new { error = "Public outfit not found" });

                // Get the updated outfit with items to return
                var updatedOutfit = await _publicCollectionService.GetPublicOutfitDetailAsync(id);

                return Ok(new 
                { 
                    message = "Public outfit updated successfully",
                    data = updatedOutfit
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// [ADMIN] Delete public outfit
        /// </summary>
        [HttpDelete("admin/outfits/{id}")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminDeleteOutfit(int id)
        {
            try
            {
                var success = await _publicCollectionService.DeletePublicOutfitAsync(id);
                if (!success)
                    return NotFound(new { error = "Public outfit not found" });

                return Ok(new { message = "Public outfit deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        #endregion

        #region Admin Endpoints (Item Management)

        /// <summary>
        /// [ADMIN] Get all items in a public outfit
        /// </summary>
        [HttpGet("admin/outfits/{outfitId}/items")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminGetOutfitItems(int outfitId)
        {
            try
            {
                var items = await _publicCollectionService.GetPublicOutfitItemsAsync(outfitId);
                return Ok(new { data = items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// [ADMIN] Add item to public outfit
        /// </summary>
        [HttpPost("admin/outfits/{outfitId}/items")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminAddItemToOutfit(int outfitId, [FromForm] PublicItemCreateRequest request)
        {
            try
            {
                var itemId = await _publicCollectionService.AddItemToPublicOutfitAsync(outfitId, request);
                
                // Get the updated outfit with all items to return
                var updatedOutfit = await _publicCollectionService.GetPublicOutfitDetailAsync(outfitId);

                return Ok(new
                {
                    itemId = itemId,
                    message = "Item added to public outfit successfully",
                    data = updatedOutfit
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

        /// <summary>
        /// [ADMIN] Update public item
        /// </summary>
        [HttpPut("admin/items/{itemId}")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminUpdateItem(int itemId, [FromForm] PublicItemUpdateRequest request)
        {
            try
            {
                var success = await _publicCollectionService.UpdatePublicItemAsync(itemId, request);
                if (!success)
                    return NotFound(new { error = "Public item not found" });

                // Get the item to find its outfit
                var item = await _publicCollectionService.GetPublicOutfitItemsAsync(itemId);
                
                return Ok(new 
                { 
                    message = "Public item updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// [ADMIN] Delete public item
        /// </summary>
        [HttpDelete("admin/items/{itemId}")]
        [Authorize] // TODO: Add admin role check
        public async Task<IActionResult> AdminDeleteItem(int itemId)
        {
            try
            {
                var success = await _publicCollectionService.DeletePublicItemAsync(itemId);
                if (!success)
                    return NotFound(new { error = "Public item not found" });

                return Ok(new { message = "Public item deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        #endregion
    }
}