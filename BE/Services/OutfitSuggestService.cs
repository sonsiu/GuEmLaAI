using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Outfit;
using GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest;
using GuEmLaAI.BusinessObjects.ResponseModels.OutfitSuggest;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GuEmLaAI.Services
{
    public class OutfitSuggestService
    {
        private readonly GuEmLaAiContext _context;
        private readonly WasabiS3Service _wasabiS3Service;
        private readonly NotificationService _notificationService;

        public OutfitSuggestService(GuEmLaAiContext context, WasabiS3Service wasabiS3Service, NotificationService notificationService)
        {
            _context = context;
            _wasabiS3Service = wasabiS3Service;
            _notificationService = notificationService;
        }

        public async Task<int> SaveHistoryAsync(int userId, SaveSuggestionHistoryRequest request)
        {
            var now = DateTime.UtcNow;

            // Convert Options to JSON for storage
            var optionsJson = JsonSerializer.Serialize(request.Options ?? new List<StylingOptionRequest>());
            
            // Also build legacy fields for backward compatibility
            var allItemIds = request.Options?.SelectMany(o => o.ItemIds).Distinct().ToList() ?? new List<int>();
            var outfitSets = request.Options?.Select(o => o.ItemIds).ToList() ?? new List<List<int>>();
            var generatedImages = request.Options?
                .Where(o => !string.IsNullOrEmpty(o.GeneratedImageUrl))
                .Select(o => o.GeneratedImageUrl!)
                .ToList() ?? new List<string>();

            // If legacy fields were provided directly, use them
            if ((request.WardrobeItemIds?.Count ?? 0) > 0)
                allItemIds = request.WardrobeItemIds!;
            if ((request.OutfitItemSets?.Count ?? 0) > 0)
                outfitSets = request.OutfitItemSets!;
            if ((request.GeneratedImages?.Count ?? 0) > 0)
                generatedImages = request.GeneratedImages!;

            var entity = new OutfitSuggestion
            {
                UserId = userId,
                QueryText = request.QueryText,
                WardrobeVersion = request.WardrobeVersion,
                Options = optionsJson,
                ModelImageUrl = request.ModelImageUrl,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.OutfitSuggestions.Add(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        public async Task<bool> DeleteHistoryAsync(int userId, int historyId)
        {
            var entry = await _context.OutfitSuggestions
                .FirstOrDefaultAsync(x => x.Id == historyId && x.UserId == userId);

            if (entry == null)
                return false;

            _context.OutfitSuggestions.Remove(entry);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> ClearHistoryAsync(int userId)
        {
            var entries = await _context.OutfitSuggestions
                .Where(x => x.UserId == userId)
                .ToListAsync();

            if (entries.Count == 0)
                return 0;

            _context.OutfitSuggestions.RemoveRange(entries);
            await _context.SaveChangesAsync();
            return entries.Count;
        }

        private static string SerializeSafely<T>(IEnumerable<T> value)
        {
            return JsonSerializer.Serialize(value ?? Enumerable.Empty<T>());
        }

        public async Task<List<OutfitSuggestionDto>> GetHistoryAsync(int userId, int limit = 50)
        {
            var rawEntries = await _context.OutfitSuggestions
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit)
                .Select(x => new 
                {
                    x.Id,
                    x.QueryText,
                    x.WardrobeVersion,
                    x.Options,
                    x.PreviewImageUrl,
                    x.ModelImageUrl,
                    x.CreatedAt
                })
                .ToListAsync();

            var results = new List<OutfitSuggestionDto>();
            
            foreach (var x in rawEntries)
            {
                var dto = new OutfitSuggestionDto
                {
                    Id = x.Id,
                    QueryText = x.QueryText,
                    WardrobeVersion = x.WardrobeVersion,
                    PreviewImageUrl = GetPreSignedUrlSafe(x.PreviewImageUrl),
                    ModelImageUrl = GetPreSignedUrlSafe(x.ModelImageUrl),
                    CreatedAt = x.CreatedAt,
                    OptionsJson = x.Options ?? "[]",
                    Options = new List<StylingOptionDto>()
                };

                // Parse Options JSON and generate pre-signed URLs
                try
                {
                    var optionsRaw = JsonSerializer.Deserialize<List<StylingOptionRequest>>(x.Options ?? "[]");
                    if (optionsRaw != null && optionsRaw.Count > 0)
                    {
                        dto.Options = optionsRaw.Select(opt => new StylingOptionDto
                        {
                            Title = opt.Title,
                            Description = opt.Description,
                            IsFromWardrobe = opt.IsFromWardrobe,
                            ItemIds = opt.ItemIds ?? new List<int>(),
                            GeneratedImageUrl = GetPreSignedUrlSafe(opt.GeneratedImageUrl)
                        }).ToList();
                    }
                }
                catch
                {
                    throw new Exception("Failed to parse Options JSON from outfit suggestion history.");
                }

                results.Add(dto);
            }

            return results;
        }
        
        private string? GetPreSignedUrlSafe(string? filenameOrUrl)
        {
            if (string.IsNullOrWhiteSpace(filenameOrUrl)) return null;
            
            // If already a full URL, return as-is
            if (filenameOrUrl.StartsWith("http://") || filenameOrUrl.StartsWith("https://"))
                return filenameOrUrl;
            
            // Otherwise generate pre-signed URL
            try
            {
                return _wasabiS3Service.GetPreSignedUrl(filenameOrUrl, WasabiImageFolder.items);
            }
            catch
            {
                return null;
            }
        }

        public async Task<UserModels> GetModelsAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return new UserModels();

            var modelImageNames = await _context.Models
                .AsNoTracking()
                .Where(um => um.UserId == userId)
                .Select(um => um.ImageName)
                .ToListAsync();

            var modelUrls = modelImageNames
                .Select(imageName => _wasabiS3Service.GetPreSignedUrl(imageName, WasabiImageFolder.items))
                .ToList();

        
            return new UserModels
            {
                DefaultModelName = user.ModelPicture,
                ModelUrls = modelUrls
            };
        }


        public class UserModels
        {
            public string DefaultModelName { get; set; } = string.Empty;
            public List<string> ModelUrls { get; set; } = new();
        }

        public async Task<bool> SetDefaultModel(int userId, string filename)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return false;

                var modelExists = await _context.Models
                    .AnyAsync(m => m.UserId == userId && m.ImageName == filename);

                if (!modelExists)
                    return false;

                user.ModelPicture = filename;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error setting default model: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> CheckRequirementAysnc(int value)
        {
            var user = await _context.Users.FindAsync(value);
            var itemCount = await _context.Items.CountAsync(i => i.UserId == value);

            if(itemCount >= 10)
                return true;

            return false;
        }

        public async Task<int> SaveOutfitFromSuggestionAsync(int userId, SaveSuggsetionOutfitRequest request)
        {
            // Validate user existence
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User does not exist");

            // Parse the item template to get item IDs
            List<int> itemIds = request.ItemIds;

            // Fetch the actual items from database
            var items = await _context.Items
                .Where(i => itemIds.Contains(i.Id) && i.UserId == userId)
                .ToListAsync();

            if (items.Count == 0)
                throw new ArgumentException("Items from try-on result not found");

            var outfitName = !string.IsNullOrWhiteSpace(request.Name)
                ? request.Name
                : $"Try-On Outfit {DateTime.UtcNow:MMM dd, yyyy HH:mm}";

            var jsonTemplate = BuildJsonTemplateFromItems(items);

            // Extract filename from imagePreview (handle both presigned URLs and plain filenames)
            var imagePreview = ExtractFilenameFromUrl(request.ImagePreview);

            var outfit = new Outfit
            {
                UserId = userId,
                Name = outfitName,
                ImagePreview = imagePreview,
                JsonTemplate = jsonTemplate,
                IsPublic = false, // Try-on outfits are private by default
                CreatedAt = DateTime.UtcNow
            };

            outfit.OutfitImages.Add(new OutfitImage
            {
                OutfitId = outfit.Id,
                ImageName = imagePreview
            });


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

        private string ExtractFilenameFromUrl(string imagePreview)
        {
            if (string.IsNullOrWhiteSpace(imagePreview))
                return string.Empty;

            // Check if it's a presigned URL (contains http/https)
            if (imagePreview.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                imagePreview.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                // Extract filename from URL path (e.g., /items/guid.webp from full URL)
                var uri = new Uri(imagePreview);
                var filename = System.IO.Path.GetFileName(uri.LocalPath);
                
                // Remove query parameters if present
                if (filename.Contains('?'))
                {
                    filename = filename.Substring(0, filename.IndexOf('?'));
                }
                
                return filename;
            }

            // It's already just a filename
            return imagePreview;
        }

       
    }
}
