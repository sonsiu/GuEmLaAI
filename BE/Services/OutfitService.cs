using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Outfit;
using GuEmLaAI.BusinessObjects.ResponseModels.Outfit;
using GuEmLaAI.BusinessObjects.ResponseModels.Weather;
using GuEmLaAI.Helper;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Nodes;

namespace GuEmLaAI.Services
{

    public class OutfitService
    {
        private readonly GuEmLaAiContext _context;
        private readonly WasabiS3Service _wasabiS3Service;
        private readonly NotificationService _notificationService;

        public OutfitService(GuEmLaAiContext context, WasabiS3Service wasabiS3Service, NotificationService notificationService)
        {
            _context = context;
            _wasabiS3Service = wasabiS3Service;
            _notificationService = notificationService;
        }

        public async Task<(List<OutfitResponseModel> outfits, int totalOutfits, int totalPages)> GetOutfitsByUserAsync(
                int userId,
                int pageNumber = 1,
                int pageSize = 12,
                string searchQuery = null,
                bool? isFavorite = null)
        {
            // Validate pagination parameters
            if (pageNumber < 1)
                pageNumber = 1;
            if (pageSize < 1 || pageSize > 100)
                pageSize = 12;

            // Build base query
            var query = _context.Outfits.Where(o => o.UserId == userId);

            // Apply search filter if searchQuery is provided
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchLower = searchQuery.ToLower().Trim();
                query = query.Where(o => o.Name.ToLower().Contains(searchLower));
            }

            // Get total count after applying filters
            var totalOutfits = await query.CountAsync();

            // Fetch paginated results
            var outfits = await query
                .Include(o => o.OutfitSeasons)
                .OrderByDescending(o => o.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = outfits.Select(outfit => MapOutfitToResponse(outfit, includeJsonTemplate: false)).ToList();
            var totalPages = (int)Math.Ceiling((double)totalOutfits / pageSize);

            return (response, totalOutfits, totalPages);
        }


        public async Task<OutfitResponseModel?> GetOutfitAsync(int outfitId)
        {
            var outfit = await _context.Outfits
                .Include(o => o.OutfitSeasons)
                .FirstOrDefaultAsync(o => o.Id == outfitId);

            return outfit == null ? null : MapOutfitToResponse(outfit, includeJsonTemplate: true);
        }

        public async Task<int> CreateOutfitAsync(int userId, OutfitCreateRequest request, IFormFile? imageFile = null)
        {
            // Validate user existence
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User does not exist");

            string? fileName = null;

            // Handle image upload if provided
            if (imageFile != null && imageFile.Length > 0)
            {
                fileName = await UploadAndConvertImageAsync(imageFile, WasabiImageFolder.items);
            }

            var outfit = new Outfit
            {
                UserId = userId,
                Name = request.Name,
                ImagePreview = fileName ?? "",
                JsonTemplate = request.JsonTemplate,
                IsPublic = request.IsPublic,
                IsFavorite = request.IsFavorite,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            if (request.Seasons != null)
            {
                foreach (var seasonName in request.Seasons)
                {
                    outfit.OutfitSeasons.Add(new OutfitSeason { SeasonName = seasonName });
                }
            }

            _context.Outfits.Add(outfit);

            user.OutfitUploadCount = (user.OutfitUploadCount ?? 0) + 1;

            await _context.SaveChangesAsync();
            await _notificationService.SendNotificationAsync(
                userId,
                $"New outfit has been updated to your wardrobe !",
                 NotificationType.SYSTEM,
                NotificationCategory.Success

            );

            await _notificationService.SendOutfitCreatedNotificationAsync(userId, outfit.Name);

            return outfit.Id;
        }
        public async Task<bool> UpdateOutfitAsync(int outfitId, OutfitUpdateRequest request)
        {
            // Start a transaction to ensure atomicity
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var outfit = await _context.Outfits
                        .Include(o => o.OutfitSeasons)
                        .FirstOrDefaultAsync(o => o.Id == outfitId);

                    if (outfit == null)
                        return false;

                    // Validate provided fields are not empty and within length limits
                    if (request.Name != null && string.IsNullOrWhiteSpace(request.Name))
                        throw new ArgumentException("Outfit name cannot be empty.");
                    if (request.Name != null && request.Name.Length > 100)
                        throw new ArgumentException("Outfit name must be 100 characters or less.");

                    if (request.Seasons != null && request.Seasons.Count == 0)
                        throw new ArgumentException("Seasons are required. Please select at least one season.");
                    if (request.Seasons != null && request.Seasons.Any(s => string.IsNullOrWhiteSpace(s) || s.Length > 50))
                        throw new ArgumentException("Each season name must be non-empty and 50 characters or less.");

                    // Validate no duplicate seasons
                    if (request.Seasons != null)
                    {
                        var uniqueSeasons = request.Seasons.Distinct().ToList();
                        if (uniqueSeasons.Count != request.Seasons.Count)
                            throw new ArgumentException("Duplicate seasons are not allowed. Each season must be unique.");
                    }

                    // Update outfit name if provided
                    if (!string.IsNullOrWhiteSpace(request.Name))
                        outfit.Name = request.Name;

                    // Update IsFavorite if provided
                    if (request.IsFavorite.HasValue)
                        outfit.IsFavorite = request.IsFavorite.Value;

                    outfit.UpdatedAt = DateTime.UtcNow;

                    // Update seasons if provided
                    if (request.Seasons != null)
                    {
                        _context.OutfitSeasons.RemoveRange(outfit.OutfitSeasons);
                        foreach (var seasonName in request.Seasons)
                        {
                            outfit.OutfitSeasons.Add(new OutfitSeason
                            {
                                OutfitId = outfitId,
                                SeasonName = seasonName
                            });
                        }
                    }

                    await _context.SaveChangesAsync();

                    // Commit the transaction if everything succeeded
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception ex)
                {
                    // Rollback the transaction on any error
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Error updating outfit {outfitId}: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task UpdateOutfitWearCount(int outfitId)
        {
            var outfit = await _context.Outfits
               .FirstOrDefaultAsync(i => i.Id == outfitId);

            if (outfit == null)
                return;

            outfit.WearCount += 1;
            await _context.SaveChangesAsync();
        }
        public async Task<bool> DeleteOutfitAsync(int outfitId)
        {
            try
            {
                var outfit = await _context.Outfits
                    .Include(o => o.OutfitSeasons)
                    .Include(o => o.OutfitImages)
                    .FirstOrDefaultAsync(o => o.Id == outfitId);

                if (outfit == null)
                    return false;

                // Delete associated OutfitSeasons
                if (outfit.OutfitSeasons != null && outfit.OutfitSeasons.Any())
                {
                    _context.OutfitSeasons.RemoveRange(outfit.OutfitSeasons);
                }

                // Delete associated OutfitImages
                if (outfit.OutfitImages != null && outfit.OutfitImages.Any())
                {
                    // Delete all associated image files from Wasabi S3
                    foreach (var outfitImage in outfit.OutfitImages)
                    {
                        if (!string.IsNullOrEmpty(outfitImage.ImageName))
                        {
                            try
                            {
                                //await _wasabiS3Service.DeleteFileAsync(outfitImage.ImageName, WasabiImageFolder.items);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Warning: Failed to delete outfit image '{outfitImage.ImageName}' from Wasabi S3: {ex.Message}");
                                // Continue deletion even if S3 deletion fails
                            }
                        }
                    }

                    _context.OutfitImages.RemoveRange(outfit.OutfitImages);
                }

                // Delete main outfit preview image
                if (!string.IsNullOrEmpty(outfit.ImagePreview))
                {
                    try
                    {
                        //await _wasabiS3Service.DeleteFileAsync(outfit.ImagePreview, WasabiImageFolder.items);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete outfit preview image '{outfit.ImagePreview}' from Wasabi S3: {ex.Message}");
                        // Continue with outfit deletion even if S3 deletion fails
                    }
                }

                // Delete the outfit itself
                _context.Outfits.Remove(outfit);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting outfit: {ex.Message}", ex);
            }
        }
        private OutfitResponseModel MapOutfitToResponse(Outfit outfit, bool includeJsonTemplate = false)
        {
            // Execute the query first with ToList(), then project with Select()
            var poseImages = _context.OutfitImages
                .Where(oi => oi.OutfitId == outfit.Id)
                .ToList()
                .Select(oi => _wasabiS3Service.GetPreSignedUrl(oi.ImageName, WasabiImageFolder.items))
                .ToList();

            // Extract item IDs from JSON template
            var itemIds = ExtractAllItemIds(outfit.JsonTemplate);

            // Get the items and their presigned URLs
            var itemImages = new List<ItemData>();
            if (itemIds.Any())
            {
                itemImages = _context.Items
                    .Where(i => itemIds.Contains(i.Id))
                    .ToList()
                    .Select(i => new ItemData
                    {
                        Id = i.Id,
                        ImageUrl = _wasabiS3Service.GetPreSignedUrl(i.ImagePreview, WasabiImageFolder.items),
                        Name = i.Comment,
                        CategoryCode = i.CategoryCode
                    })
                    .ToList();
            }
            
            var response = new OutfitResponseModel
            {
                Id = outfit.Id,
                Name = outfit.Name,
                ImagePreview = outfit.ImagePreview,
                ImageUrl = string.IsNullOrEmpty(outfit.ImagePreview)
                    ? null
                    : _wasabiS3Service.GetPreSignedUrl(outfit.ImagePreview, WasabiImageFolder.items),
                IsPublic = outfit.IsPublic,
                IsFavorite = outfit.IsFavorite,
                Comment = outfit.Comment,
                CreatedAt = outfit.CreatedAt,
                UpdatedAt = outfit.UpdatedAt,
                OutfitSeasons = outfit.OutfitSeasons.Select(s => s.SeasonName).ToList(),
                ItemIds = itemIds,
                PoseImages = poseImages,
                ItemImages = itemImages
            };

            if (includeJsonTemplate)
            {
                response.JsonTemplate = InjectPresignedUrlIntoTemplate(outfit.JsonTemplate, WasabiImageFolder.items);
            }

            return response;
        }

        

        private string InjectPresignedUrlIntoTemplate(string jsonTemplate, WasabiImageFolder folder)
        {
            try
            {
                var jsonObject = JsonNode.Parse(jsonTemplate);
                if (jsonObject == null) return jsonTemplate;

                var objects = jsonObject["objects"]?.AsArray();
                if (objects == null) return jsonTemplate;

                foreach (var obj in objects)
                {
                    if (obj == null) continue;

                    var type = obj["type"]?.GetValue<string>();
                    var src = obj["src"]?.GetValue<string>();

                    if (type == "Image" && !string.IsNullOrEmpty(src))
                    {
                        obj["src"] = _wasabiS3Service.GetPreSignedUrl(src, folder);

                        var fileExtension = Path.GetExtension(src);
                        var fileName = Path.GetFileNameWithoutExtension(src);
                        obj["name"] = $"{fileName}{fileExtension}";
                    }
                }

                return jsonObject.ToJsonString();
            }
            catch
            {
                return jsonTemplate; 
            }
        }

        private List<int> ExtractAllItemIds(string jsonTemplate)
        {
            var itemIds = new List<int>();

            if (string.IsNullOrEmpty(jsonTemplate))
                return itemIds;

            try
            {
                var jsonObject = JsonNode.Parse(jsonTemplate);
                if (jsonObject == null)
                    return itemIds;

                var objects = jsonObject["objects"]?.AsArray();
                if (objects == null || objects.Count == 0)
                    return itemIds;

                foreach (var obj in objects)
                {
                    if (obj == null)
                        continue;

                    var type = obj["type"]?.GetValue<string>();

                    if (type == "Image")
                    {
                        var itemIdValue = obj["itemId"];
                        if (itemIdValue != null && int.TryParse(itemIdValue.ToString(), out int itemId) && !itemIds.Contains(itemId))
                        {
                            itemIds.Add(itemId);
                        }
                    }
                }

                return itemIds;
            }
            catch
            {
                return itemIds; 
            }
        }
        private async Task<string> UploadAndConvertImageAsync(IFormFile imageFile, WasabiImageFolder folder)
        {
            // Convert to WebP
            using var inputStream = imageFile.OpenReadStream();
            using var webpStream = await ImageConverter.ConvertToWebP(inputStream);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}.webp";

            // Upload to Wasabi S3
            await _wasabiS3Service.UploadFileAsync(
                webpStream,
                fileName,
                "image/webp",
                folder
            );

            return fileName;
        }

        /// <summary>
        /// Download image from S3, convert to stream, and re-upload to a different folder
        /// Used for copying try-on results from generated_images to outfits folder
        /// </summary>
        private async Task<string> CopyAndConvertImageAsync(string sourceFileName, WasabiImageFolder sourceFolder, WasabiImageFolder targetFolder)
        {
            // Get the source image from S3
            using var sourceStream = await _wasabiS3Service.DownloadFileAsync(sourceFileName, sourceFolder);

            // Convert to WebP (in case it's not already)
            using var webpStream = await ImageConverter.ConvertToWebP(sourceStream);

            // Generate new unique filename for outfit
            var newFileName = $"{Guid.NewGuid()}.webp";

            // Upload to target folder (outfits)
            await _wasabiS3Service.UploadFileAsync(
                webpStream,
                newFileName,
                "image/webp",
                targetFolder
            );

            return newFileName;
        }

        /// <summary>
        /// Get outfit suggestions based on weather conditions
        /// </summary>
        public async Task<List<Outfit>> GetOutfitsByWeatherAsync(int userId, string season, double temperature, bool hasRain)
        {
            var query = _context.Outfits
                .Include(o => o.OutfitSeasons)
                .Where(o => o.UserId == userId);

            // Filter by season if outfits have season tags
            var outfitsWithSeasons = await query
                .Where(o => o.OutfitSeasons.Any(os => os.SeasonName == season || os.SeasonName == "All year round"))
                .ToListAsync();

            // If no outfits match the season, return all user outfits
            if (!outfitsWithSeasons.Any())
            {
                outfitsWithSeasons = await query.ToListAsync();
            }

            // Additional filtering based on temperature and rain
            // Prioritize favorites
            var sortedOutfits = outfitsWithSeasons
                .OrderByDescending(o => o.IsFavorite)
                .ThenByDescending(o => o.CreatedAt)
                .ToList();

            return sortedOutfits;
        }

        /// <summary>
        /// Build outfit suggestion response with weather context
        /// </summary>
        public async Task<OutfitSuggestionResponse> BuildOutfitSuggestionAsync(
            int userId,
            WeatherResponse weather,
            string season)
        {
            var outfits = await GetOutfitsByWeatherAsync(
                userId,
                season,
                weather.Temperature,
                weather.HasPrecipitation
            );

            var suggestedOutfits = outfits.Select(o => new SuggestedOutfit
            {
                Id = o.Id,
                Name = o.Name,
                ImagePreviewUrl = _wasabiS3Service.GetPreSignedUrl(o.ImagePreview, WasabiImageFolder.items),
                IsFavorite = o.IsFavorite,
                Comment = o.Comment,
                Seasons = o.OutfitSeasons.Select(os => os.SeasonName).ToList(),
                MatchReason = BuildMatchReason(o, season, weather)
            }).ToList();

            return new OutfitSuggestionResponse
            {
                WeatherContext = new WeatherContext
                {
                    LocationName = weather.LocationName,
                    Temperature = weather.Temperature,
                    TemperatureUnit = weather.TemperatureUnit,
                    WeatherText = weather.WeatherText,
                    SeasonRecommendation = season,
                    HasPrecipitation = weather.HasPrecipitation,
                    PrecipitationType = weather.PrecipitationType
                },
                SuggestedOutfits = suggestedOutfits,
                RecommendationReason = BuildRecommendationReason(weather, season)
            };
        }

        private string BuildMatchReason(Outfit outfit, string season, WeatherResponse weather)
        {
            var reasons = new List<string>();

            if (outfit.OutfitSeasons.Any(os => os.SeasonName == season))
                reasons.Add($"Perfect for {season}");

            if (outfit.IsFavorite)
                reasons.Add("Your favorite");

            if (weather.HasPrecipitation)
                reasons.Add("Consider rain protection");

            return reasons.Any() ? string.Join(" • ", reasons) : "Recommended for you";
        }

        private string BuildRecommendationReason(WeatherResponse weather, string season)
        {
            var temp = weather.Temperature;
            var reasons = new List<string>();

            reasons.Add($"Current temperature: {temp}°{weather.TemperatureUnit}");

            if (temp < 15)
                reasons.Add("It's cold - layer up with warm clothing");
            else if (temp < 20)
                reasons.Add("Mild weather - light jacket recommended");
            else if (temp < 28)
                reasons.Add("Pleasant temperature - dress comfortably");
            else
                reasons.Add("It's hot - wear light, breathable fabrics");

            if (weather.HasPrecipitation)
                reasons.Add($"Expected {weather.PrecipitationType} - consider waterproof options");

            if (weather.UVIndex > 6)
                reasons.Add("High UV index - sun protection recommended");

            return string.Join(". ", reasons) + ".";
        }

        /// <summary>
        /// Save a try-on result from HistoryBoard as an Outfit
        /// </summary>
        public async Task<int> SaveOutfitFromHistoryBoardAsync(int userId, SaveTryOnOutfitRequest request)
        {
            // Validate user existence
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User does not exist");

            // Get the HistoryBoard entry
            //var historyBoard = await _context.HistoryBoards
               // .FirstOrDefaultAsync(hb => hb.Id == request.HistoryBoardId && hb.UserId == userId);

            // Parse the item template to get item IDs
            List<int> itemIds = request.ClothingItemIds;

            // Fetch the actual items from database
            var items = await _context.Items
                .Include(i => i.ItemSeasons)
                .Where(i => itemIds.Contains(i.Id) && i.UserId == userId)
                .ToListAsync();

            if (items.Count == 0)
                throw new ArgumentException("Items from try-on result not found");

            var outfitName = !string.IsNullOrWhiteSpace(request.Name)
                ? request.Name
                : $"Try-On Outfit {DateTime.UtcNow:MMM dd, yyyy HH:mm}";

            var jsonTemplate = BuildJsonTemplateFromItems(items);

            var seasons = request.Seasons ?? InferSeasonsFromItems(items);

            var outfit = new Outfit
            {
                UserId = userId,
                Name = outfitName,
                ImagePreview = request.modelFileName[0],
                JsonTemplate = jsonTemplate,
                IsPublic = false, // Try-on outfits are private by default
                IsFavorite = request.IsFavorite,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            if(request.modelFileName != null && request.modelFileName.Any())
            {
                foreach (var item in request.modelFileName)
                {
                    outfit.OutfitImages.Add(new OutfitImage
                    {
                        OutfitId = outfit.Id,
                        ImageName = item
                    });
                }
            }

            // Add seasons
            if (seasons != null && seasons.Any())
            {
                foreach (var seasonName in seasons)
                {
                    outfit.OutfitSeasons.Add(new OutfitSeason { SeasonName = seasonName });
                }
            }

            _context.Outfits.Add(outfit);

            // Update user's outfit upload count
            user.OutfitUploadCount = (user.OutfitUploadCount ?? 0) + 1;


            await _context.SaveChangesAsync();

            await _notificationService.SendNotificationAsync(
                userId,
                $"New outfit '{outfit.Name}' has been saved from your try-on!",
                NotificationType.SYSTEM,
                NotificationCategory.Success
            );

            return outfit.Id;
        }

        /// <summary>
        /// Build a Fabric.js compatible JSON template from items
        /// </summary>
        private string BuildJsonTemplateFromItems(List<Item> items)
        {
            var objects = items.Select((item, index) => new
            {
                type = "Image",
                version = "5.3.0",
                originX = "left",
                originY = "top",
                left = 100,
                top = 100 + (index * 200), // Stack items vertically
                width = 200,
                height = 200,
                scaleX = 1,
                scaleY = 1,
                angle = 0,
                src = item.ImagePreview, // Filename only
                itemId = item.Id,
                name = $"{item.Comment}" //Display the name (stored in Comment) 
            }).ToList();

            var template = new
            {
                version = "5.3.0",
                objects = objects
            };

            return System.Text.Json.JsonSerializer.Serialize(template);
        }

        /// <summary>
        /// Infer seasons from items
        /// </summary>
        private List<string> InferSeasonsFromItems(List<Item> items)
        {
            var seasons = items
                .SelectMany(i => i.ItemSeasons.Select(s => s.SeasonName))
                .Distinct()
                .ToList();

            // If no seasons or all are "All year round", return "All year round"
            if (!seasons.Any() || seasons.All(s => s == "All year round"))
            {
                return new List<string> { "All year round" };
            }

            return seasons;
        }

        // Helper class for deserializing ItemJsonTemplate
        private class TryOnItemData
        {
            public int id { get; set; }
            public string image_preview { get; set; } = "";
            public string? comment { get; set; }
            public string category_code { get; set; } = "";
        }

    }
}
