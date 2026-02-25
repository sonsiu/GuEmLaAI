using System.Net;
using System.Security.Claims;
using AutoMapper;
using BusinessObjects.RequestModels.Authen;
using BusinessObjects.ResponseModels.Authen;
using FluentEmail.Core;
using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.ResponseModels.Authen;
using GuEmLaAI.Helper;
using GuEmLaAI.BusinessObjects.Models;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.UriParser;
using System.IdentityModel.Tokens.Jwt;

namespace GuEmLaAI.Services {
    public class AuthenService {
        private readonly GuEmLaAiContext _context;
        private readonly IMapper _mapper;
        private readonly UserService _userService;
        private readonly EmailService _emailService;
        private readonly NotificationService _notificationService;
        private readonly IConfiguration _config;
        
        public AuthenService(
            GuEmLaAiContext context,
            IMapper mapper,
            IConfiguration config,
            UserService userService,
            EmailService emailService,
            NotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _userService = userService;
            _emailService = emailService;
            _notificationService = notificationService;
            _config = config;
        }

        public async Task<LoginResponseModel> LoginAsync([FromBody] LoginRequestModel model) {
            User? user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password)) {
                throw new Exception("Invalid email or password");
            }

            if (await _userService.IsEmailVerified(user) == false) {
                throw new Exception("Email has not been verified");
            }

            // Check if user was referred by another user
           

            var token = _userService.CreateJwtToken(user);
            var refreshToken = _userService.CreateRefreshToken(user);
            var response = _mapper.Map<LoginResponseModel>(user);
            response.AccessToken = token;
            response.RefreshToken = refreshToken;
            response.ItemUploadCount = user.ItemUploadCount ?? 0;
            response.OutfitUploadCount = user.OutfitUploadCount ?? 0;
            response.VirtualTryOnUsedCount = user.VirtualTryOnUsedCount ?? 0;
            response.ReferralStatus = user.ReferralStatus ?? ReferralStatus.None.ToString();
            response.ReferredById = user.ReferredById ?? 0;
            response.ReferralCode = user.ReferralCode ?? "";


            return response;
        }
        public async Task<LoginResponseModel?> RefreshTokenAsync(string refreshToken)
        {
            var principal = _userService.ValidateRefreshToken(refreshToken);
            if (principal == null) return null;

            var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst(JwtRegisteredClaimNames.Sub);
            if (subClaim == null) return null;

            if (!int.TryParse(subClaim.Value, out var userId)) return null;

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            var newAccessToken = _userService.CreateJwtToken(user);
            var newRefreshToken = _userService.CreateRefreshToken(user);

            var response = _mapper.Map<LoginResponseModel>(user);
            response.AccessToken = newAccessToken;
            response.RefreshToken = newRefreshToken;
            response.ItemUploadCount = user.ItemUploadCount ?? 0;
            response.OutfitUploadCount = user.OutfitUploadCount ?? 0;
            response.VirtualTryOnUsedCount = user.VirtualTryOnUsedCount ?? 0;
            response.ReferralStatus = user.ReferralStatus ?? ReferralStatus.None.ToString();
            response.ReferredById = user.ReferredById ?? 0;
            response.ReferralCode = user.ReferralCode ?? "";

            return response;
        }

        public async Task RegisterAsync([FromBody] RegisterRequestModel model) {
            if (await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email) != null) {
                throw new Exception("Email already exists");
            }

            var user = _mapper.Map<User>(model);
            user.Password = BCrypt.Net.BCrypt.HashPassword(model.Password);
            user.Role = 3;
            user.ReferralCode = await _userService.CreateReferralCodeAsync();
            user.DisplayName = model.Username;
            user.ProfilePicture = "default-profile.png";

            // Check for referral code and create referral record
            if (!string.IsNullOrEmpty(model.ReferralCode)) {
                var referrer = await _context.Users.FirstOrDefaultAsync(u => u.ReferralCode == model.ReferralCode);
                if (referrer != null) {
                    user.ReferredById = referrer.Id;
                    user.ReferralStatus = ReferralStatus.Pending.ToString();
                }
            }

            await _userService.AddAsync(user);

            // Send welcome notification after successful registration
            // await _notificationService.SendWelcomeNotificationAsync(user.Id, user.DisplayName ?? user.Email);

            await _notificationService.SendWelcomeNotificationAsync(user.Id);

            // create verification token
            var token = await _userService.CreateEmailVerificationTokenAsync(user.Id, TimeSpan.FromHours(1));

            string verifyBaseUrl = _config["AppSettings:BackendBaseUrl"]!;
            if (string.IsNullOrWhiteSpace(verifyBaseUrl))
            {
                throw new Exception("BackendBaseUrl is not configured.");
            }
            var link = $"{verifyBaseUrl.TrimEnd('/')}/api/auth/verify-email?token={WebUtility.UrlEncode(token.Token)}";

            string templateFile = Path.Combine(
                Directory.GetCurrentDirectory(),
                "BusinessObjects",
                "EmailTemplates",
                "EmailVerificationTemplate.cshtml"
            );

            EmailMetaData emailMetaData = new
            (
                user.Email,
                "Verify your email"
            );

            await _emailService.SendEmailVerificationAsync(emailMetaData, user, templateFile, link);
        }

        public async Task<EmailVerifyResponse> VerifyEmailAsync(string token) {
            var tokenEntity = await _userService.GetUserByEmailVerificationTokenAsync(token);
            if (tokenEntity is null)
                return new EmailVerifyResponse(EmailVerifyStatus.InvalidToken, "Invalid token.");

            if (tokenEntity.IsUsed)
                return new EmailVerifyResponse(EmailVerifyStatus.AlreadyUsed, "Token has already been used.");

            if (tokenEntity.ExpiresAt < DateTime.UtcNow)
                return new EmailVerifyResponse(EmailVerifyStatus.Expired, "Token expired.");

            tokenEntity.IsUsed = true;

            await _context.SaveChangesAsync();
            return new EmailVerifyResponse(EmailVerifyStatus.Success, "Email verified successfully.");
        }

        //Validate a token by Id + validator. Returns true if valid and consumes it.
        public bool ValidateAndConsumePasswordResetToken(Guid tokenId, string validatorPlain) {
            var token = _context.PasswordResetTokens.Find(tokenId);
            if (token == null) return false;

            if (token.IsUsed || DateTime.UtcNow > token.ExpiresAt)
                return false;

            if (!BCrypt.Net.BCrypt.Verify(validatorPlain, token.ValidatorHash))
                return false;

            token.IsUsed = true;
            _context.PasswordResetTokens.Update(token);

            return true;
        }
        public async Task ForgotPasswordRequestAsync(string email) {
            User? user = await _userService.GetUserByEmail(email);
            if (user == null) {
                throw new Exception("User not found");
            }
            var (tokenId, validatorPlain) = _userService.CreateResetToken(user);

            var verifyBaseUrl = _config["AppSettings:FrontendBaseUrl"]!;
            if (string.IsNullOrWhiteSpace(verifyBaseUrl))
            {
                throw new Exception("FrontendBaseUrl is not configured.");
            }

            var link = $"{verifyBaseUrl.TrimEnd('/')}/reset-password?id={tokenId}&validator={validatorPlain}";

            string templateFile = Path.Combine(
                Directory.GetCurrentDirectory(),
                "BusinessObjects",
                "EmailTemplates",
                "ForgotPasswordTemplate.cshtml"
            );

            EmailMetaData emailMetaData = new
            (
                user!.Email,
                "Reset Your Password"
            );

            await _emailService.SendEmailVerificationAsync(emailMetaData, user, templateFile, link);
        }
        public async Task ResetPasswordAsync(ResetPasswordRequestModel model) {
            var token = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == model.Id);

            if (token == null || token.IsUsed || token.ExpiresAt < DateTime.UtcNow) {
                throw new Exception("Invalid or expired reset token.");
            }

            // Verify validator
            bool isValid = BCrypt.Net.BCrypt.Verify(model.Validator, token.ValidatorHash);
            if (!isValid) {
                throw new Exception("Invalid token validator.");
            }

            // Prevent reusing old password
            if (BCrypt.Net.BCrypt.Verify(model.NewPassword, token.User.Password)) {
                throw new Exception("New password cannot be the same as the old password.");
            }

            // Update user password (hash first!)
            token.User.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);

            token.IsUsed = true;

            await _context.SaveChangesAsync();
        }
    }
}
