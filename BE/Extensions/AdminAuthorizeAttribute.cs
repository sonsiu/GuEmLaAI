using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace GuEmLaAI.Extensions
{
    public class AdminAuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Check if user is authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "User not authenticated" 
                });
                return;
            }

            // Get role from JWT claims
            var roleClaim = user.FindFirst("Role")?.Value;
            
            if (string.IsNullOrEmpty(roleClaim) || !int.TryParse(roleClaim, out int role) || role != 1)
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}