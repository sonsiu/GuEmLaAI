using GuEmLaAI.BusinessObjects.RequestModels.Collection;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CollectionController : ControllerBase
    {
        private readonly CollectionService _collectionService;

        public CollectionController(CollectionService collectionService)
        {
            _collectionService = collectionService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateCollection([FromForm] CreateCollectionRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var result = await _collectionService.CreateCollectionAsync(userId, request);
            if (result == null)
                return BadRequest("Failed to create collection");

            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCollection(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _collectionService.GetCollectionByIdAsync(id, userId == 0 ? null : userId);

            if (result == null)
                return NotFound("Collection not found or access denied");

            return Ok(result);
        }

        [HttpGet("{id}/details")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCollectionDetails(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _collectionService.GetCollectionDetailsAsync(id, userId == 0 ? null : userId);

            if (result == null)
                return NotFound("Collection not found or access denied");

            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserCollections(int userId)
        {
            var currentUserId = GetCurrentUserId();
            var includePrivate = currentUserId == userId;

            var result = await _collectionService.GetUserCollectionsAsync(userId, includePrivate);
            return Ok(result);
        }

        [HttpGet("my-collections")]
        public async Task<IActionResult> GetMyCollections()
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var result = await _collectionService.GetUserCollectionsAsync(userId, true);
            return Ok(result);
        }

        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicCollections([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _collectionService.GetPublicCollectionsAsync(pageNumber, pageSize);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromForm] UpdateCollectionRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var result = await _collectionService.UpdateCollectionAsync(id, userId, request);
            if (result == null)
                return NotFound("Collection not found or access denied");

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCollection(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var success = await _collectionService.DeleteCollectionAsync(id, userId);
            if (!success)
                return NotFound("Collection not found or access denied");

            return Ok(new { message = "Collection deleted successfully" });
        }

        [HttpPost("{id}/outfits")]
        public async Task<IActionResult> AddOutfitToCollection(int id, [FromBody] AddOutfitToCollectionRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var success = await _collectionService.AddOutfitToCollectionAsync(id, userId, request.OutfitId);
            if (!success)
                return BadRequest("Failed to add outfit to collection. Collection or outfit not found, or outfit already in collection.");

            return Ok(new { message = "Outfit added to collection successfully" });
        }

        [HttpDelete("{id}/outfits/{outfitId}")]
        public async Task<IActionResult> RemoveOutfitFromCollection(int id, int outfitId)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized("User not authenticated");

            var success = await _collectionService.RemoveOutfitFromCollectionAsync(id, userId, outfitId);
            if (!success)
                return NotFound("Collection or outfit not found");

            return Ok(new { message = "Outfit removed from collection successfully" });
        }
    }
}