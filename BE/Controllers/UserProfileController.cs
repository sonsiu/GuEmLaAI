using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.User;
using GuEmLaAI.BusinessObjects.ResponseModels.User;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GuEmLaAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly CreditService _creditService;
        private readonly GuEmLaAiContext _context;

        public UserProfileController(UserService userService, CreditService creditService, GuEmLaAiContext context)
        {
            _userService = userService;
            _creditService = creditService;
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var profile = await _userService.GetUserProfileAsync(userId.Value);
            return profile != null ? Ok(profile) : NotFound();
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var success = await _userService.UpdateUserProfileAsync(userId.Value, request);
            if (!success)
                return BadRequest(new { error = "Failed to update profile." });

            var updatedProfile = await _userService.GetUserProfileAsync(userId.Value);
            
            
            return Ok(new { message = "Profile updated successfully.", profile = updatedProfile });
        }

        [HttpGet("loadModelPicture")]
        public async Task<ActionResult<UserProfileResponse>> GetModelPicture()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var profile = await _userService.GetUserModelPictureAsync(userId.Value);
            return profile != null ? Ok(profile) : NotFound();
        }

        [HttpGet("defaultModelPicture")]
        public async Task<IActionResult> GetDefaultModelPicture()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var modelPicture = await _userService.GetDefaultModelPictureAsync(userId.Value);
            if (modelPicture == null)
                return NotFound();

            return Ok(new { modelPicture = modelPicture.Value.FileName, modelPictureUrl = modelPicture.Value.Url });
        }
    }
}
