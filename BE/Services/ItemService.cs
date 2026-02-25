using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Item;
using GuEmLaAI.BusinessObjects.ResponseModels.Item;
using GuEmLaAI.Helper;
using GuEmLaAI.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace GuEmLaAI.Services
{
    public class ItemService
    {
        private readonly GuEmLaAiContext _context;
        private readonly WasabiS3Service _wasabiS3Service;
        private readonly GeminiHelper _geminiService;
        private readonly ReplicateService _replicateService;
        private readonly NotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;


        public ItemService(
            GuEmLaAiContext context,
            WasabiS3Service wasabiS3Service,
            GeminiHelper geminiService,
            ReplicateService replicateService,
            NotificationService notificationService,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _wasabiS3Service = wasabiS3Service;
            _geminiService = geminiService;
            _replicateService = replicateService;
            _notificationService = notificationService;
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        }

        public async Task<(List<ItemResponseModel> items, int totalItems, int totalPages)> GetItemsByUserAsync(
            int userId,
            int pageNumber = 1,
            int pageSize = 8,
            string? category = null,
            List<string>? colors = null,
            List<string>? occasions = null,
            List<string>? sizes = null,
            List<string>? seasons = null,
            bool? isFavorite = null,
            bool? isPublic = null,
            string? searchQuery = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User does not exist");

            if (pageNumber < 1)
                pageNumber = 1;
            if (pageSize < 1 || pageSize > 100)
                pageSize = 6;

            // Build query with filters
            IQueryable<Item> query = _context.Items
                .Where(i => i.UserId == userId)
                .Include(i => i.ItemSeasons)
                .Include(i => i.ItemColors)
                .Include(i => i.ItemSizes)
                .Include(i => i.ItemOccasions);

            // Apply category filter - extract first part before underscore and match
            if (!string.IsNullOrEmpty(category))
            {
                var categoryPrefix = category.Split('_')[0];
                query = query.Where(i => i.CategoryCode.StartsWith(categoryPrefix));
            }

            // Apply color filters
            if (colors != null && colors.Any())
            {
                query = query.Where(i => i.ItemColors.Any(c => colors.Contains(c.ColorName)));
            }

            // Apply occasion filters
            if (occasions != null && occasions.Any())
            {
                query = query.Where(i => i.ItemOccasions.Any(o => occasions.Contains(o.OccasionName)));
            }

            // Apply size filters
            if (sizes != null && sizes.Any())
            {
                query = query.Where(i => i.ItemSizes.Any(s => sizes.Contains(s.SizeName)));
            }

            // Apply season filters
            if (seasons != null && seasons.Any())
            {
                query = query.Where(i => i.ItemSeasons.Any(s => seasons.Contains(s.SeasonName)));
            }

            // Apply favorite filter
            if (isFavorite.HasValue)
            {
                query = query.Where(i => i.IsFavorite == isFavorite.Value);
            }

            // Apply public filter
            if (isPublic.HasValue)
            {
                query = query.Where(i => i.IsPublic == isPublic.Value);
            }

            // Apply search filter (searches in Comment/ItemName and Description)
            if (!string.IsNullOrEmpty(searchQuery))
            {
                var searchLower = searchQuery.ToLower();
                query = query.Where(i =>
                    i.Comment.ToLower().Contains(searchLower));
            }

            // Get total count before pagination
            var totalItems = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = items.Select(item => MapItemToResponse(item)).ToList();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            return (response, totalItems, totalPages);
        }
        public async Task<ItemResponseModel?> GetItemAsync(int itemId)
        {
            var item = await _context.Items
                .Include(i => i.ItemSeasons)
                .Include(i => i.ItemColors)
                .Include(i => i.ItemSizes)
                .Include(i => i.ItemOccasions)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            return item == null ? null : MapItemToResponse(item);
        }
        public async Task<int> CreateItemAsync(int userId, ItemCreateRequest request, IFormFile? imageFile = null)
        {
            // Start a transaction to ensure atomicity
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user == null)
                        throw new ArgumentException("User does not exist");

                    // Validate required fields
                    if (string.IsNullOrEmpty(request.CategoryName))
                        throw new ArgumentException("CategoryName is required.");
                    if (request.CategoryName.Length > 50)
                        throw new ArgumentException("CategoryName must be 50 characters or less.");
                    if (string.IsNullOrEmpty(request.ItemName))
                        throw new ArgumentException("ItemName is required.");
                    if (request.ItemName.Length > 500)
                        throw new ArgumentException("ItemName must be 500 characters or less.");
                    if (string.IsNullOrEmpty(request.Description))
                        throw new ArgumentException("Description is required.");
                    if (request.Description.Length > 255)
                        throw new ArgumentException("Description must be 255 characters or less.");

                    if (request.Seasons == null || request.Seasons.Count == 0)
                        throw new ArgumentException("Seasons are required. Please select at least one season.");
                    if (request.Seasons.Any(s => string.IsNullOrEmpty(s) || s.Length > 50))
                        throw new ArgumentException("Each season name must be non-empty and 50 characters or less.");

                    if (request.Colors == null || request.Colors.Count == 0)
                        throw new ArgumentException("Colors are required. Please select at least one color.");
                    if (request.Colors.Any(c => string.IsNullOrEmpty(c) || c.Length > 50))
                        throw new ArgumentException("Each color name must be non-empty and 50 characters or less.");

                    var uniqueSeasons = request.Seasons.Distinct().ToList();
                    if (uniqueSeasons.Count != request.Seasons.Count)
                        throw new ArgumentException("Duplicate seasons are not allowed. Each season must be unique.");

                    var uniqueColors = request.Colors.Distinct().ToList();
                    if (uniqueColors.Count != request.Colors.Count)
                        throw new ArgumentException("Duplicate colors are not allowed. Each color must be unique.");

                    if (request.Occasions != null && request.Occasions.Count == 0)
                        throw new ArgumentException("Occasions are required. Please select at least one occasion.");

                    Console.WriteLine($"Creating item for user {userId} in category {request.CategoryName}");
                    // Validate category exists
                    var categoryExists = await _context.ItemCategories.AnyAsync(c => c.CategoryCode == request.CategoryName);
                    if (!categoryExists)
                        throw new ArgumentException("Invalid category name. Please select a valid category.");

                    string? fileName = null;

                    if (imageFile != null && imageFile.Length > 0)
                    {
                        try
                        {
                            fileName = await UploadAndConvertImageAsync(imageFile);
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            throw new Exception($"Failed to upload image: {ex.Message}", ex);
                        }
                    }
                    else
                    {
                        throw new ArgumentException("Image file is empty");
                    }

                    var item = new Item
                    {
                        UserId = userId,
                        CategoryCode = request.CategoryName,
                        ImagePreview = fileName ?? "",
                        IsPublic = false,
                        IsFavorite = request.IsFavorite,
                        Comment = request.ItemName,
                        Description = request.Description,
                        CreatedAt = DateTime.UtcNow,
                        Size = request.Size
                    };

                    if (request.Seasons != null)
                    {
                        foreach (var seasonName in request.Seasons)
                        {
                            item.ItemSeasons.Add(new ItemSeason { SeasonName = seasonName });
                        }
                    }

                    if (request.Colors != null)
                    {
                        foreach (var colorName in request.Colors)
                        {
                            item.ItemColors.Add(new ItemColor { ColorName = colorName });
                        }
                    }

                    if (request.Occasions != null)
                    {
                        foreach (var occasionName in request.Occasions)
                        {
                            item.ItemOccasions.Add(new ItemOccasion { OccasionName = occasionName });
                        }
                    }

                    _context.Items.Add(item);

                    user.ItemUploadCount = (user.ItemUploadCount ?? 0) + 1;

                    await _context.SaveChangesAsync();

                    try
                    {
                        await _notificationService.SendItemCreatedNotificationAsync(userId, item.Comment ?? item.CategoryCode);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to send notification: {ex.Message}");
                        // Don't rollback for notification failure - it's not critical
                    }

                    // Commit the transaction if everything succeeded
                    await transaction.CommitAsync();
                    return item.Id;
                }
                catch (Exception ex)
                {
                    // Rollback the transaction on any error
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Error creating item: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task<int> CreateItemPublicAsync(ItemCreateRequest request, IFormFile? imageFile = null)
        {
            // Start a transaction to ensure atomicity
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Validate required fields
                    if (string.IsNullOrEmpty(request.CategoryName))
                        throw new ArgumentException("CategoryName is required.");
                    if (request.CategoryName.Length > 50)
                        throw new ArgumentException("CategoryName must be 50 characters or less.");
                    if (string.IsNullOrEmpty(request.ItemName))
                        throw new ArgumentException("ItemName is required.");
                    if (request.ItemName.Length > 500)
                        throw new ArgumentException("ItemName must be 500 characters or less.");
                    if (string.IsNullOrEmpty(request.Description))
                        throw new ArgumentException("Description is required.");
                    if (request.Description.Length > 255)
                        throw new ArgumentException("Description must be 255 characters or less.");

                    if (request.Seasons == null || request.Seasons.Count == 0)
                        throw new ArgumentException("Seasons are required. Please select at least one season.");
                    if (request.Seasons.Any(s => string.IsNullOrEmpty(s) || s.Length > 50))
                        throw new ArgumentException("Each season name must be non-empty and 50 characters or less.");

                    if (request.Colors == null || request.Colors.Count == 0)
                        throw new ArgumentException("Colors are required. Please select at least one color.");
                    if (request.Colors.Any(c => string.IsNullOrEmpty(c) || c.Length > 50))
                        throw new ArgumentException("Each color name must be non-empty and 50 characters or less.");

                    var uniqueSeasons = request.Seasons.Distinct().ToList();
                    if (uniqueSeasons.Count != request.Seasons.Count)
                        throw new ArgumentException("Duplicate seasons are not allowed. Each season must be unique.");

                    var uniqueColors = request.Colors.Distinct().ToList();
                    if (uniqueColors.Count != request.Colors.Count)
                        throw new ArgumentException("Duplicate colors are not allowed. Each color must be unique.");

                    if (request.Occasions != null && request.Occasions.Count == 0)
                        throw new ArgumentException("Occasions are required. Please select at least one occasion.");

                    // Validate category exists
                    var categoryExists = await _context.ItemCategories.AnyAsync(c => c.CategoryCode == request.CategoryName);
                    if (!categoryExists)
                        throw new ArgumentException("Invalid category name. Please select a valid category.");

                    string? fileName = null;

                    if (imageFile != null && imageFile.Length > 0)
                    {
                        try
                        {
                            fileName = await UploadAndConvertImageAsync(imageFile);
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            throw new Exception($"Failed to upload image: {ex.Message}", ex);
                        }
                    }
                    else
                    {
                        throw new ArgumentException("Image file is empty");
                    }

                    var item = new Item
                    {
                        UserId = -1,
                        CategoryCode = request.CategoryName,
                        ImagePreview = fileName ?? "",
                        IsPublic = true,
                        IsFavorite = request.IsFavorite,
                        Comment = request.ItemName,
                        Description = request.Description,
                        CreatedAt = DateTime.UtcNow,
                        Size = request.Size
                    };

                    if (request.Seasons != null)
                    {
                        foreach (var seasonName in request.Seasons)
                        {
                            item.ItemSeasons.Add(new ItemSeason { SeasonName = seasonName });
                        }
                    }

                    if (request.Colors != null)
                    {
                        foreach (var colorName in request.Colors)
                        {
                            item.ItemColors.Add(new ItemColor { ColorName = colorName });
                        }
                    }

                    if (request.Occasions != null)
                    {
                        foreach (var occasionName in request.Occasions)
                        {
                            item.ItemOccasions.Add(new ItemOccasion { OccasionName = occasionName });
                        }
                    }

                    // Commit the transaction if everything succeeded
                    await transaction.CommitAsync();
                    return item.Id;
                }
                catch (Exception ex)
                {
                    // Rollback the transaction on any error
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Error creating item: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task<bool> UpdateItemAsync(int itemId, ItemUpdateRequest request)
        {
            // Start a transaction to ensure atomicity
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var item = await _context.Items
                        .Include(i => i.ItemSeasons)
                        .Include(i => i.ItemColors)
                        .Include(i => i.ItemSizes)
                        .Include(i => i.ItemOccasions)
                        .FirstOrDefaultAsync(i => i.Id == itemId);

                    if (item == null)
                        return false;

                    // Validate provided fields are not empty and within length limits
                    if (request.ItemName != null && string.IsNullOrEmpty(request.ItemName))
                        throw new ArgumentException("ItemName cannot be empty.");
                    if (request.ItemName != null && request.ItemName.Length > 500)
                        throw new ArgumentException("ItemName must be 500 characters or less.");
                    if (request.Description != null && string.IsNullOrEmpty(request.Description))
                        throw new ArgumentException("Description cannot be empty.");
                    if (request.Description != null && request.Description.Length > 255)
                        throw new ArgumentException("Description must be 255 characters or less.");
                    if (request.CategoryName != null && string.IsNullOrEmpty(request.CategoryName))
                        throw new ArgumentException("CategoryName cannot be empty.");
                    if (request.CategoryName != null && request.CategoryName.Length > 50)
                        throw new ArgumentException("CategoryName must be 50 characters or less.");

                    if (request.Seasons != null && request.Seasons.Count == 0)
                        throw new ArgumentException("Seasons are required. Please select at least one season.");
                    if (request.Seasons != null && request.Seasons.Any(s => string.IsNullOrEmpty(s) || s.Length > 50))
                        throw new ArgumentException("Each season name must be non-empty and 50 characters or less.");

                    if (request.Colors != null && request.Colors.Count == 0)
                        throw new ArgumentException("Colors are required. Please select at least one color.");
                    if (request.Colors != null && request.Colors.Any(c => string.IsNullOrEmpty(c) || c.Length > 50))
                        throw new ArgumentException("Each color name must be non-empty and 50 characters or less.");

                    if (request.Occasions != null && request.Occasions.Count == 0)
                        throw new ArgumentException("Occasions are required. Please select at least one occasion.");

                    if (request.Seasons != null)
                    {
                        var uniqueSeasons = request.Seasons.Distinct().ToList();
                        if (uniqueSeasons.Count != request.Seasons.Count)
                            throw new ArgumentException("Duplicate seasons are not allowed. Each season must be unique.");
                    }

                    if (request.Colors != null)
                    {
                        var uniqueColors = request.Colors.Distinct().ToList();
                        if (uniqueColors.Count != request.Colors.Count)
                            throw new ArgumentException("Duplicate colors are not allowed. Each color must be unique.");
                    }

                    // Validate category if provided
                    if (!string.IsNullOrEmpty(request.CategoryName))
                    {
                        var categoryExists = await _context.ItemCategories.AnyAsync(c => c.CategoryCode == request.CategoryName);
                        if (!categoryExists)
                            throw new ArgumentException("Invalid category name. Please select a valid category.");
                        item.CategoryCode = request.CategoryName;
                    }

                    if (!string.IsNullOrEmpty(request.ItemName))
                        item.Comment = request.ItemName;
                    if (request.IsFavorite.HasValue)
                        item.IsFavorite = request.IsFavorite.Value;
                    if (request.Description != null)
                        item.Description = request.Description;
                    if (request.Size != null)
                        item.Size = request.Size;

                    item.UpdatedAt = DateTime.UtcNow;

                    if (request.Seasons != null)
                    {
                        _context.ItemSeasons.RemoveRange(item.ItemSeasons);
                        foreach (var seasonName in request.Seasons)
                        {
                            item.ItemSeasons.Add(new ItemSeason
                            {
                                ItemId = itemId,
                                SeasonName = seasonName
                            });
                        }
                    }

                    if (request.Colors != null)
                    {
                        _context.ItemColors.RemoveRange(item.ItemColors);
                        foreach (var colorName in request.Colors)
                        {
                            item.ItemColors.Add(new ItemColor
                            {
                                ItemId = itemId,
                                ColorName = colorName
                            });
                        }
                    }

                    if (request.Occasions != null)
                    {
                        _context.ItemOccasions.RemoveRange(item.ItemOccasions);
                        foreach (var occasionName in request.Occasions)
                        {
                            item.ItemOccasions.Add(new ItemOccasion
                            {
                                ItemId = itemId,
                                OccasionName = occasionName
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
                    Console.WriteLine($"Error updating item {itemId}: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task UpdateItemWearCount(int itemId)
        {
            var item = await _context.Items
               .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null)
                return;

            item.WearCount += 1;
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteItemAsync(int itemId)
        {
            // Start a transaction to ensure atomicity - if anything fails, rollback everything
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var item = await _context.Items
                        .Include(i => i.ItemSeasons)
                        .Include(i => i.ItemColors)
                        .Include(i => i.ItemSizes)
                        .Include(i => i.ItemOccasions)
                        .FirstOrDefaultAsync(i => i.Id == itemId);

                    if (item == null)
                        return false;

                    if (item.ItemSeasons.Any())
                    {
                        _context.ItemSeasons.RemoveRange(item.ItemSeasons);
                    }

                    if (item.ItemOccasions.Any())
                    {
                        _context.ItemOccasions.RemoveRange(item.ItemOccasions);
                    }

                    if (item.ItemSizes.Any())
                    {
                        _context.ItemSizes.RemoveRange(item.ItemSizes);
                    }

                    if (item.ItemColors.Any())
                    {
                        _context.ItemColors.RemoveRange(item.ItemColors);
                    }

                    _context.Items.Remove(item);

                    // Save database changes first
                    await _context.SaveChangesAsync();

                    // Delete the image from Wasabi S3 if it exists
                    if (!string.IsNullOrEmpty(item.ImagePreview))
                    {
                        try
                        {
                            await _wasabiS3Service.DeleteFileAsync(item.ImagePreview, WasabiImageFolder.items);
                        }
                        catch (Exception ex)
                        {
                            // Log the warning but rollback the entire transaction if S3 deletion fails
                            Console.WriteLine($"Warning: Failed to delete image '{item.ImagePreview}' from Wasabi S3: {ex.Message}");
                            await transaction.RollbackAsync();
                            throw new Exception($"Failed to delete item image from storage: {ex.Message}", ex);
                        }
                    }

                    // Commit the transaction if everything succeeded
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception ex)
                {
                    // Rollback the transaction on any error
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Error deleting item {itemId}: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task<CleanGarmentResponse> GenerateCleanGarmentAsync(string imageBase64, object? constraintsJson)
        {
            if (string.IsNullOrEmpty(imageBase64))
                throw new ArgumentException("Image is required");

            //const string prompt = "The final output MUST be a product photo with a strict 4:5 aspect ratio. " +
            //    "The background MUST be pure white (#ffffff). Place the garment from the uploaded image onto this background. " +
            //    "The garment should be perfectly centered, top-down flat-lay style, and scaled to fill approximately 80% of the image's height, " +
            //    "leaving a consistent margin. Remove all shadows, creases, and perspective distortion. " +
            //    "The final image should be clean, professional, and ready for an e-commerce website. " +
            //    "AFTER generating the image, provide the following details: " +
            //    "1. A short, concise description of the garment's style, material, or purpose, starting with 'Description: '. " +
            //    "2. The categories of the garment (e.g., 'Shirt', 'Pants', 'Dress'), starting with 'Categories: '. " +
            //    "3. The primary color(s) of the garment, starting with 'Color: '.";

            var promptBuilder = new StringBuilder("Generate a product photo with a strict 4:5 aspect ratio. " +
                "The background MUST be pure white (#ffffff). Place the garment from the uploaded image onto this background. " +
                "The garment should be perfectly centered, top-down flat-lay style, and scaled to fill approximately 80% of the image's height, " +
                "leaving a consistent margin. Remove all shadows, creases, and perspective distortion. " +
                "The final image should be clean, professional, and ready for an e-commerce website. " +
                "Output the generated image first. Immediately after the image, output ONLY a valid JSON object with the following exact properties: " +
                "{\"name\": \"name\", \"colors\": [\"color1\", \"color2\"], \"categories\": [\"category1\"] \"sizes\": [\"size1\"], \"seasons\": [\"season1\"], \"occasions\": [\"occasion1\", \"occasion2\"], \"description\": \"short description of style, material, fit\"}." +
                "Do note that there should only be ONE category and ONE size,, the others can be larger, the structure up there is just an example." +
                "The Description should be short and concise, so it fits the 200 char limit." +
                "Do not include any additional text, labels, explanations, or formatting outside the JSON." +
                "I'll send you a list of colors, categories, etc..., choose from there to make the json, and only from there.");

            promptBuilder.Append($"\nConstraints: {constraintsJson.ToString()}");

            var prompt = promptBuilder.ToString();

            var aiResult = await _geminiService.GetAiSegmentAsync(
                new List<string> { imageBase64 },
                prompt
            );

            var finalResult = await RemoveBackgroundFromBase64Async(aiResult.ImageDataUrl);

            return new CleanGarmentResponse
            {
                finalResult = finalResult,
                name = aiResult.Name,
                colors = aiResult.Colors,
                categories = aiResult.Categories,
                sizes = aiResult.Sizes,
                seasons = aiResult.Seasons,
                occasions = aiResult.Occasions,
                description = aiResult.Description
            };
        }

        public async Task<string> RemoveBackgroundAsync(IFormFile? imageFile, string? imageUrl)
        {
            if (imageFile == null && string.IsNullOrEmpty(imageUrl))
                throw new ArgumentException("Either ImageFile or ImageUrl is required");

            string imageUrlForProcessing;

            if (imageFile != null && imageFile.Length > 0)
            {
                imageUrlForProcessing = await ConvertImageToBase64DataUrlAsync(imageFile);
            }
            else
            {
                imageUrlForProcessing = imageUrl!;
            }

            string processedImageUrl;
            try
            {
                processedImageUrl = await _replicateService.RemoveBackgroundAndWaitAsync(
                    imageUrlForProcessing,
                    maxWaitSeconds: 300 // 5 minutes max wait
                );
            }
            catch (TimeoutException)
            {
                throw new Exception("Background removal processing timed out after 5 minutes");
            }
            catch (Exception ex)
            {
                throw new Exception($"Replicate API error: {ex.Message}", ex);
            }

            string processedImageBase64 = await DownloadImageWithRetryAsync(processedImageUrl);

            return processedImageBase64;
        }
        private ItemResponseModel MapItemToResponse(Item item)
        {
            return new ItemResponseModel
            {
                Id = item.Id,
                CategoryName = item.CategoryCode,
                ImagePreview = item.ImagePreview,
                ImageUrl = string.IsNullOrEmpty(item.ImagePreview) 
                    ? null 
                    : _wasabiS3Service.GetPreSignedUrl(item.ImagePreview, WasabiImageFolder.items),
                IsPublic = item.IsPublic,
                IsFavorite = item.IsFavorite,
                Comment = item.Comment,
                Description = item.Description,
                Size = item.Size,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                ItemSeasons = item.ItemSeasons.Select(s => s.SeasonName).ToList(),
                ItemColors = item.ItemColors.Select(c => c.ColorName).ToList(),
                ItemOccasions = item.ItemOccasions.Select(o => o.OccasionName).ToList()
            };
        }

        private async Task<string> UploadAndConvertImageAsync(IFormFile imageFile)
        {
            using var inputStream = imageFile.OpenReadStream();
            using var webpStream = await ImageConverter.ConvertToWebP(inputStream);

            var fileName = $"{Guid.NewGuid()}.webp";

            await _wasabiS3Service.UploadFileAsync(
                webpStream,
                fileName,
                "image/webp",
                WasabiImageFolder.items
            );

            return fileName;
        }
        private async Task<string> RemoveBackgroundFromBase64Async(string imageDataUrl)
        {
            try
            {
                // imageDataUrl is already in format "data:image/png;base64,..." from GeminiHelper
                // Just pass it directly to Replicate - don't add another prefix!

                string processedImageUrl;
                try
                {
                    processedImageUrl = await _replicateService.RemoveBackgroundAndWaitAsync(
                        imageDataUrl,  // ✅ Pass directly - already has data URL prefix
                        maxWaitSeconds: 300
                    );
                }
                catch (TimeoutException)
                {
                    throw new Exception("Background removal processing timed out after 5 minutes");
                }
                catch (Exception ex)
                {
                    throw new Exception($"Replicate API error: {ex.Message}", ex);
                }

                // Download the processed image from Replicate and convert to base64
                string processedImageBase64 = await DownloadImageWithRetryAsync(processedImageUrl);

                return processedImageBase64;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to remove background from base64 image: {ex.Message}", ex);
            }
        }
        private async Task<string> ConvertImageToBase64DataUrlAsync(IFormFile imageFile)
        {
            using var inputStream = imageFile.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await inputStream.CopyToAsync(memoryStream);

            var base64Image = Convert.ToBase64String(memoryStream.ToArray());
            var mimeType = imageFile.ContentType ?? "image/jpeg";
            return $"data:{mimeType};base64,{base64Image}";
        }

        private async Task<string> DownloadImageWithRetryAsync(string imageUrl, int maxRetries = 3)
        {
            const int initialDelayMs = 500;
            int currentDelayMs = initialDelayMs;

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
                    httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

                    using var imageStream = await httpClient.GetStreamAsync(imageUrl);
                    using var memoryStream = new MemoryStream();
                    await imageStream.CopyToAsync(memoryStream);

                    var processedImageBase64 = Convert.ToBase64String(memoryStream.ToArray());

                    return processedImageBase64;
                }
                catch (HttpRequestException ex) when (attempt < maxRetries - 1)
                {
                    await Task.Delay(currentDelayMs);
                    currentDelayMs = (int)(currentDelayMs * 2);
                }
                catch (Exception ex) when (attempt < maxRetries - 1)
                {
                    await Task.Delay(currentDelayMs);
                    currentDelayMs = (int)(currentDelayMs * 2);
                }
            }

            throw new Exception($"Failed to download image from {imageUrl} after {maxRetries} attempts");
        }
    }
}
