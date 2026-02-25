using AutoMapper;
using BusinessObjects.ResponseModels.Authen;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.User;
using GuEmLaAI.BusinessObjects.ResponseModels.User;
using GuEmLaAI.Controllers;
using GuEmLaAI.Helper;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace GuEmLaAI.Services
{
    public class UserService
    {
        // Bump this when the wardrobe response shape changes to force new ETags/versions.
        private const string WardrobeSchemaVersion = "wardrobe-v2";

        private readonly GuEmLaAiContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;
        private readonly WasabiS3Service _wasabiS3Service;
        private readonly CalendarService _calendarService;


        public UserService(GuEmLaAiContext context, IMapper mapper, IConfiguration config, WasabiS3Service wasabiS3Service, CalendarService calendarService)
        {
            _context = context;
            _mapper = mapper;
            _config = config;
            _wasabiS3Service = wasabiS3Service;
            _calendarService = calendarService;
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            
            // Create a default calendar day for the new user
            await _calendarService.EnsureUserCalendarDayExistsAsync(user.Id, "{}");
        }

        public async Task<User?> GetUserByEmail(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task<User?> GetUserByReferralCodeAsync(string referralCode)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.ReferralCode == referralCode);
        }

        public async Task<string> CreateReferralCodeAsync()
        {
            string referralCode;

            do
            {
                referralCode = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            }
            while (await _context.Users.AnyAsync(u => u.ReferralCode == referralCode));

            return referralCode;
        }

        public string CreateJwtToken(User user)
        {
            string secretKey = _config["Jwt:Secret"]!;
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim("Role", user.Role.ToString()!),
                ]),
                Expires = DateTime.UtcNow.AddHours(_config.GetValue<int>("Jwt:ExpirationInHours")),
                SigningCredentials = credentials,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public string CreateRefreshToken(User user)
        {
            string secretKey = _config["Jwt:RefreshSecret"] ?? _config["Jwt:Secret"]!;
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            int expiryDays = _config.GetValue<int?>("Jwt:RefreshExpirationInDays") ?? 30;

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim("Role", user.Role.ToString()!),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                ]),
                Expires = DateTime.UtcNow.AddDays(expiryDays),
                SigningCredentials = credentials,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal? ValidateRefreshToken(string refreshToken)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_config["Jwt:RefreshSecret"] ?? _config["Jwt:Secret"]!);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _config["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _config["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                var principal = tokenHandler.ValidateToken(refreshToken, validationParameters, out _);
                return principal;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh token validation failed: {ex.Message}");
                return null;
            }
        }

        public LoginResponseModel MapToLoginResponse(User user, string token, string? refreshToken = null)
        {
            var response = _mapper.Map<LoginResponseModel>(user);
            response.AccessToken = token;
            response.RefreshToken = refreshToken;
            return response;
        }

        public async Task<EmailVerificationToken> CreateEmailVerificationTokenAsync(int userId, TimeSpan validFor)
        {
            var token = new EmailVerificationToken
            {
                Id = Guid.NewGuid().ToString(),
                Token = TokenHelper.GenerateSecureToken(),
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.Add(validFor),
                CreatedAt = DateTime.UtcNow
            };

            await _context.EmailVerificationTokens.AddAsync(token);
            await _context.SaveChangesAsync();
            return token;
        }

        public async Task<EmailVerificationToken?> GetUserByEmailVerificationTokenAsync(string token) => await _context.EmailVerificationTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.Token == token);

        public async Task<Boolean> IsEmailVerified(User user) =>
            await _context.EmailVerificationTokens.AnyAsync(t =>
            t.UserId == user.Id &&
            t.IsUsed
        );

        //Generate a reset token. Returns the plain validator and entity.
        public (string tokenId, string validatorPlain) CreateResetToken(User user, int expiryMinutes = 30)
        {
            // Generate plain validator using your helper
            string validatorPlain = TokenHelper.GenerateSecureToken();

            // Hash the validator before storing
            string validatorHash = BCrypt.Net.BCrypt.HashPassword(validatorPlain);

            var entity = new PasswordResetToken
            {
                Id = Guid.NewGuid().ToString(),
                UserId = user.Id, //int
                ValidatorHash = validatorHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                CreatedAt = DateTime.UtcNow
            };

            _context.PasswordResetTokens.Add(entity);
            _context.SaveChanges();

            return (entity.Id, validatorPlain);
        }

        // Simplified Profile Management
        public async Task<UserProfileResponse?> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            return new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
                ProfilePicture = user.ProfilePicture,
                ProfilePictureUrl = !string.IsNullOrEmpty(user.ProfilePicture)
                    ? _wasabiS3Service.GetPreSignedUrl(user.ProfilePicture, WasabiImageFolder.items)
                    : null,
                Bio = user.Bio,
                Height = user.Height,
                Weight = user.Weight,
                CreateDate = user.CreateDate,
                UpdatedAt = user.UpdatedAt,
                AvailableToken = user.AvailableToken,
                ReferralCode = user.ReferralCode,
                Role = user.Role,
                TodayModelPictureCreatedCount = user.TodayModelPictureCreatedCount ?? 0,
                TodayImageGeneratedCount = user.TodayImageGeneratedCount ?? 0,
                TodayItemGeneratedCount = user.TodayItemGeneratedCount ?? 0,
                MaxImageGeneratePerDay = user.MaxImageGenerated ?? 0,
                MaxItemGeneratePerDay = user.MaxItemGenerated ?? 0,
                MaxModelCreatePerDay = user.MaxModelCreated ?? 0,
            };
        }

        // Simplified
        public async Task<UserProfileResponse?> GetUserModelPictureAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Models)  // ← Include Models collection
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            // Convert all Model images to presigned URLs
            var modelPictureUrls = user.Models
                .Where(m => !string.IsNullOrEmpty(m.ImageName))
                .Select(m => _wasabiS3Service.GetPreSignedUrl(m.ImageName, WasabiImageFolder.items))
                .ToList();

            return new UserProfileResponse
            {
                modelPictureUrls = modelPictureUrls,
                DefaultModelPictureUrl = user.ModelPicture,
                Role = user.Role,
                TodayModelPictureCreatedCount = user.TodayModelPictureCreatedCount ?? 0,
                TodayImageGeneratedCount = user.TodayImageGeneratedCount ?? 0,
                TodayItemGeneratedCount = user.TodayItemGeneratedCount ?? 0,
                MaxImageGeneratePerDay = user.MaxImageGenerated ?? 0,
                MaxItemGeneratePerDay = user.MaxItemGenerated ?? 0,
                MaxModelCreatePerDay = user.MaxModelCreated ?? 0
            };
        }

        public async Task<(string FileName, string Url)?> GetDefaultModelPictureAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return null;

            // Only use the default model picture stored on the User record
            var fileName = string.IsNullOrWhiteSpace(user.ModelPicture) ? null : user.ModelPicture;

            if (string.IsNullOrWhiteSpace(fileName))
                return null;

            var url = _wasabiS3Service.GetPreSignedUrl(fileName, WasabiImageFolder.items);
            return (fileName, url);
        }

        public async Task<bool> UpdateUserProfileAsync(int userId, UpdateProfileRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                // Update basic profile information
                if (!string.IsNullOrWhiteSpace(request.DisplayName))
                    user.DisplayName = request.DisplayName.Trim();

                if (request.Bio != null)
                    user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();

                user.Height = request.Height;
                user.Weight = request.Weight;

                // Handle profile image upload or deletion
                if (request.ProfileImage != null && request.ProfileImage.Length > 0)
                {
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(user.ProfilePicture))
                    {
                        try
                        {
                            await _wasabiS3Service.DeleteFileAsync(user.ProfilePicture, WasabiImageFolder.items);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Warning: Failed to delete old profile image '{user.ProfilePicture}': {ex.Message}");
                        }
                    }

                    // Upload new image
                    using var inputStream = request.ProfileImage.OpenReadStream();
                    using var webpStream = await ImageConverter.ConvertToWebP(inputStream);
                    var fileName = $"profile_{userId}_{Guid.NewGuid()}.webp";

                    await _wasabiS3Service.UploadFileAsync(webpStream, fileName, "image/webp", WasabiImageFolder.items);
                    user.ProfilePicture = fileName;
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user profile: {ex.Message}");
                return false;
            }
        }

        public record WardrobeSnapshot(List<object> Items, DateTime LastModifiedUtc, string Version);

        public async Task<WardrobeSnapshot> GetUserWardrobeSnapshotAsync(int userId) {
            var items = await _context.Items
                .Where(i => i.UserId == userId)
                .Include(i => i.ItemSeasons)
                .Include(i => i.ItemColors)
                .Include(i => i.ItemOccasions)
                .Include(i => i.CategoryCodeNavigation)
                .ToListAsync();

            if (!items.Any())
                return new WardrobeSnapshot(new List<object>(), DateTime.MinValue, "empty"); // controller handles response

            var descriptions = items.Select(item => new
            {
                id = item.Id,
                category = item.CategoryCode,
                size = item.Size,
                description = item.Description,
                season = (item.ItemSeasons ?? new List<ItemSeason>()).Select(s => s.SeasonName).Where(n => n != null).ToList(),
                color = (item.ItemColors ?? new List<ItemColor>()).Select(c => c.ColorName).Where(n => n != null).ToList(),
                occasions = (item.ItemOccasions ?? new List<ItemOccasion>())
                    .Select(o => o.OccasionName)
                    .Where(n => n != null)
                    .Distinct()
                    .ToList(),
                purpose = item.Purpose.IsNullOrEmpty()
                    ? item.CategoryCodeNavigation?.SoftPurpose
                    : item.Purpose
            }).ToList<object>();

            var lastModifiedUtc = items
                .Select(i => i.UpdatedAt ?? i.CreatedAt)
                .DefaultIfEmpty(DateTime.UtcNow)
                .Max()
                .ToUniversalTime();

            var version = $"{WardrobeSchemaVersion}-{lastModifiedUtc:O}-{items.Count}";

            return new WardrobeSnapshot(descriptions, lastModifiedUtc, version);
        }
    }
}
