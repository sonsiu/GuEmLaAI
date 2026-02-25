using System.Security.Claims;
using AutoMapper;
using System.Net;
using BusinessObjects.RequestModels.Authen;
using BusinessObjects.ResponseModels.Authen;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.Helper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.Enums;
using BusinessObjects.RequestModels.Authen;

namespace GuEmLaAI.Controllers {
    [Route("api/auth")]
    [ApiController]
    public class AuthenController : ControllerBase {
        private readonly AuthenService _authService;
        private readonly UserService _userService;
        private readonly OAuthStateService _oauthStateService;
        private readonly IConfiguration _config;

        public AuthenController(AuthenService authService, UserService userService, OAuthStateService oauthStateService, IConfiguration config) {
            _authService = authService;
            _userService = userService;
            _oauthStateService = oauthStateService;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestModel model) {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try {
                var response = await _authService.LoginAsync(model);
                if (response == null)
                    return Unauthorized("Invalid username or password.");
                return Ok(response);
            } catch (Exception ex) {
                return BadRequest($"Login failed: {ex.Message}");
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var response = await _authService.RefreshTokenAsync(model.RefreshToken);
            if (response == null) return Unauthorized("Invalid or expired refresh token.");
            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestModel model) {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try {
                await _authService.RegisterAsync(model);
                return Ok("Registration successful.");
            } catch (Exception ex) {
                return BadRequest($"Registration failed: {ex.Message}");
            }
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> Verify([FromQuery] string token) {
            var res = await _authService.VerifyEmailAsync(token);

            if (res.Status == EmailVerifyStatus.Success) {
                var frontendBaseUrl = _config["AppSettings:FrontendBaseUrl"];

                if (!string.IsNullOrWhiteSpace(frontendBaseUrl)) {
                    var safeBase = frontendBaseUrl.TrimEnd('/');
                    var message = WebUtility.UrlEncode(res.Message ?? "Email verified successfully.");
                    var redirectUrl = $"{safeBase}/en/login?verified=true";

                    return Redirect(redirectUrl);
                }
            }

            return res.Status switch
            {
                EmailVerifyStatus.Success => Ok(res),
                EmailVerifyStatus.InvalidToken => BadRequest(res),
                EmailVerifyStatus.AlreadyUsed => BadRequest(res),
                EmailVerifyStatus.Expired => BadRequest(res),
                _ => BadRequest(res)
            };
        }

        [HttpGet("login-google")]
        public async Task<IActionResult> LoginWithGoogle([FromQuery] string? returnUrl = null, [FromQuery] string? referralCode = null) {
            try
            {
                // Use default return URL if not provided
                var finalReturnUrl = string.IsNullOrWhiteSpace(returnUrl) ? "/" : returnUrl;
                
                // Generate and store state with referral info (CSRF protection)
                // Empty referralCode is fine - just means no referral
                var state = await _oauthStateService.GenerateAndStoreStateAsync(referralCode ?? "", finalReturnUrl);

                var props = new AuthenticationProperties { 
                    RedirectUri = Url.Action("GoogleResponse") 
                };
                props.Items["prompt"] = "select_account";
                // Store the state in AuthenticationProperties so the middleware preserves it
                props.Items["state"] = state;
                
                Console.WriteLine($"[DEBUG] LoginWithGoogle - state: {state}, referralCode: '{referralCode}', returnUrl: '{finalReturnUrl}'");
                
                return Challenge(props, GoogleDefaults.AuthenticationScheme);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] LoginWithGoogle - {ex.Message}");
                return BadRequest(new { error = "Failed to initiate Google login", details = ex.Message });
            }
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse() {
            try
            {
                // Authenticate with Google first
                var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

                if (!result.Succeeded)
                {
                    Console.WriteLine("[ERROR] GoogleResponse - Google authentication failed");
                    return Unauthorized(new { error = "Failed to authenticate with Google" });
                }

                // Get state from authentication result properties
                string? state = null;
                if (result.Properties?.Items.TryGetValue("state", out var stateValue) == true)
                {
                    state = stateValue;
                }

                Console.WriteLine($"[DEBUG] GoogleResponse - Retrieved state from properties: {state}");

                // Validate state parameter (CSRF protection - Google OAuth 2.0 spec)
                if (string.IsNullOrEmpty(state))
                {
                    Console.WriteLine("[ERROR] GoogleResponse - Missing state parameter");
                    return BadRequest(new { error = "Missing state parameter - CSRF protection failed" });
                }

                // Retrieve and validate stored state
                var oauthState = await _oauthStateService.GetAndValidateStateAsync(state);
                
                Console.WriteLine($"[DEBUG] GoogleResponse - State validated. referralCode: {oauthState.ReferralCode}, returnUrl: {oauthState.ReturnUrl}");

                string email = result.Principal.FindFirst(ClaimTypes.Email)?.Value ?? "";
                var user = await _userService.GetUserByEmail(email);

                // Add user to database if not exists
                if (user == null) {
                    user = new User()
                    {
                        Email = email,
                        DisplayName = result.Principal.FindFirst(ClaimTypes.Name)?.Value ?? "",
                        Role = 3,
                        ReferralCode = await _userService.CreateReferralCodeAsync()
                    };

                    // Use referralCode from secure state storage, not from URL parameters
                    if (!string.IsNullOrEmpty(oauthState.ReferralCode))
                    {
                        Console.WriteLine($"[DEBUG] GoogleResponse - Looking up referrer with code: {oauthState.ReferralCode}");
                        var referrer = await _userService.GetUserByReferralCodeAsync(oauthState.ReferralCode);
                        
                        if (referrer != null)
                        {
                            user.ReferredById = referrer.Id;
                            user.ReferralStatus = ReferralStatus.Pending.ToString();
                            Console.WriteLine($"[DEBUG] GoogleResponse - Referral set - ReferredById: {referrer.Id}, Status: Pending");
                        }
                        else
                        {
                            Console.WriteLine($"[DEBUG] GoogleResponse - Referrer not found for code: {oauthState.ReferralCode}");
                        }
                    }

                    await _userService.AddAsync(user);
                }

                var token = _userService.CreateJwtToken(user!);
                var refreshToken = _userService.CreateRefreshToken(user);
                var response = _userService.MapToLoginResponse(user, token, refreshToken);
                
                // URL-encode query string parameters to handle special/non-ASCII characters
                var queryString = $"?accessToken={System.Web.HttpUtility.UrlEncode(response.AccessToken)}" +
                                  $"&refreshToken={System.Web.HttpUtility.UrlEncode(response.RefreshToken)}" +
                                  $"&displayName={System.Web.HttpUtility.UrlEncode(response.DisplayName)}" +
                                  $"&id={response.Id}" +
                                  $"&role={response.Role}";
                
                return Redirect(oauthState.ReturnUrl + queryString);
            }
            catch (InvalidOperationException ex)
            {
                // CSRF attack detected or state expired
                Console.WriteLine($"[ERROR] GoogleResponse - CSRF Protection triggered: {ex.Message}");
                return BadRequest(new { error = "Invalid authentication state", details = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GoogleResponse - Unexpected error: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred during authentication", details = ex.Message });
            }
        }

        [HttpPost("forgot-password/request")]
        public async Task<IActionResult> ForgotPasswordRequest([FromBody] ForgotPasswordRequestModel model) {
            await _authService.ForgotPasswordRequestAsync(model.Email);
            return Ok(new { Message = "Password reset link has been sent if the account exists." });
        }

        [HttpPost("forgot-password/reset")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestModel model) {
            if (model.NewPassword != model.ConfirmPassword) {
                return BadRequest(new { Message = "Passwords do not match" });
            }

            try {
                await _authService.ResetPasswordAsync(model);
                return Ok(new { Message = "Password has been reset successfully." });
            } catch (Exception ex) {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
