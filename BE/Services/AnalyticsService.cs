using GuEmLaAI.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    public class AnalyticsService
    {
        private readonly GuEmLaAiContext _context;

        public AnalyticsService(GuEmLaAiContext context)
        {
            _context = context;
        }

        // Track a visit
        public async Task TrackVisitAsync(int? userId, string ipAddress, string userAgent, string pageUrl, string sessionId)
        {
            var visit = new WebsiteAnalytic
            {
                VisitDate = DateTime.UtcNow,
                UserId = userId,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                PageUrl = pageUrl,
                SessionId = sessionId,  // ← Add this
                CreatedAt = DateTime.UtcNow
            };

            _context.WebsiteAnalytics.Add(visit);
            await _context.SaveChangesAsync();
        }

        // Get total visits (everyone)
        public async Task<int> GetTotalVisitsAsync()
        {
            return await _context.WebsiteAnalytics.CountAsync();
        }

        // Get unique visitors by IP address
        public async Task<int> GetUniqueVisitorsAsync()
        {
            return await _context.WebsiteAnalytics
                .Select(v => v.IpAddress)
                .Distinct()
                .CountAsync();
        }

        // Get visits today
        public async Task<int> GetTodayVisitsAsync()
        {
            var today = DateTime.UtcNow.Date;
            return await _context.WebsiteAnalytics
                .Where(v => v.VisitDate >= today)
                .CountAsync();
        }

        // Get visits by date range
        public async Task<int> GetVisitsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.WebsiteAnalytics
                .Where(v => v.VisitDate >= startDate && v.VisitDate <= endDate)
                .CountAsync();
        }

        // Get registered users vs anonymous
        public async Task<object> GetUserTypeStatsAsync()
        {
            var total = await _context.WebsiteAnalytics.CountAsync();
            var registered = await _context.WebsiteAnalytics
                .Where(v => v.UserId != null)
                .CountAsync();
            var anonymous = total - registered;

            return new { total, registered, anonymous };
        }

        // Get visits per day (for charts)
        public async Task<List<object>> GetVisitsPerDayAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-days);

            var visitsPerDay = await _context.WebsiteAnalytics
                .Where(v => v.VisitDate >= startDate)
                .GroupBy(v => v.VisitDate.Date)
                .Select(g => new
                {
                    date = g.Key,
                    count = g.Count()
                })
                .OrderBy(v => v.date)
                .ToListAsync<object>();

            return visitsPerDay;
        }
    }
}