using Microsoft.AspNetCore.Mvc;
using GuEmLaAI.Extensions;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AdminAuthorize]  // Only admin (Role = 1) can access
    public class AdminController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly GuEmLaAiContext _context;
        private readonly AnalyticsService _analyticsService;  

        public AdminController(UserService userService, GuEmLaAiContext context, AnalyticsService analyticsService)
        {
            _userService = userService;
            _context = context;
            _analyticsService = analyticsService; 
        }

        // Example: Get all users (admin only)
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.DisplayName,
                    u.Role,
                    u.CreateDate
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalItems = await _context.Items.CountAsync();
            var totalOutfits = await _context.Outfits.CountAsync();

            var totalVisits = await _analyticsService.GetTotalVisitsAsync();
            var uniqueVisitors = await _analyticsService.GetUniqueVisitorsAsync();
            var todayVisits = await _analyticsService.GetTodayVisitsAsync();
            var userTypeStats = await _analyticsService.GetUserTypeStatsAsync();

            return Ok(new
            {
                totalUsers,
                totalItems,
                totalOutfits,
                analytics = new
                {
                    totalVisits,
                    uniqueVisitors,
                    todayVisits,
                    userTypeStats
                },
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("analytics/chart")]
        public async Task<IActionResult> GetVisitsChart([FromQuery] int days = 30)
        {
            var chartData = await _analyticsService.GetVisitsPerDayAsync(days);
            return Ok(chartData);
        }

        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateRoleRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            user.Role = request.NewRole;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role updated successfully" });
        }

    }

    public class UpdateRoleRequest
    {
        public int NewRole { get; set; }
    }
}