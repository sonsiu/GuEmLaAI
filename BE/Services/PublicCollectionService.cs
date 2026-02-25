using GuEmLaAI.BusinessObjects.Enums;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.PublicCollection;
using GuEmLaAI.BusinessObjects.ResponseModels.PublicCollection;
using GuEmLaAI.Helper;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    public class PublicCollectionService
    {
        private readonly GuEmLaAiContext _context;
        private readonly WasabiS3Service _wasabiS3Service;
        private readonly ItemService _itemService;
        private readonly OutfitService _outfitService;

        public PublicCollectionService(
            GuEmLaAiContext context,
            WasabiS3Service wasabiS3Service,
            ItemService itemService,
            OutfitService outfitService)
        {
            _context = context;
            _wasabiS3Service = wasabiS3Service;
            _itemService = itemService;
            _outfitService = outfitService;
        }

        #region Public Outfit CRUD (Admin)

        /// <summary>
        /// Get all public outfits (for admin management)
        /// </summary>
        public async Task<List<PublicOutfitResponseModel>> GetAllPublicOutfitsAsync(bool activeOnly = false)
        {
            var query = _context.PublicCollectionOutfits
                .Include(o => o.PublicOutfitSeasons)
                .Include(o => o.PublicCollectionItems)
                .AsQueryable();

            if (activeOnly)
                query = query.Where(o => o.IsActive == true);

            var outfits = await query
                .OrderBy(o => o.DisplayOrder)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            return outfits.Select(MapToResponse).ToList();
        }

        /// <summary>
        /// Get public outfit detail with items (for modal display)
        /// </summary>
        public async Task<PublicOutfitDetailResponseModel?> GetPublicOutfitDetailAsync(int outfitId)
        {
            var outfit = await _context.PublicCollectionOutfits
                .Include(o => o.PublicOutfitSeasons)
                .Include(o => o.PublicCollectionItems)
                .FirstOrDefaultAsync(o => o.Id == outfitId);

            if (outfit == null)
                return null;

            var response = new PublicOutfitDetailResponseModel
            {
                Id = outfit.Id,
                Name = outfit.Name,
                Description = outfit.Description,
                ImageUrl = _wasabiS3Service.GetPreSignedUrl(outfit.ImagePreview, WasabiImageFolder.items),
                IsActive = outfit.IsActive,
                DisplayOrder = outfit.DisplayOrder,
                Seasons = outfit.PublicOutfitSeasons.Select(s => s.SeasonName).ToList(),
                CreatedAt = outfit.CreatedAt,
                UpdatedAt = outfit.UpdatedAt,
                Items = outfit.PublicCollectionItems
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new PublicItemResponseModel
                    {
                        Id = i.Id,
                        Name = i.Name,
                        ImageUrl = _wasabiS3Service.GetPreSignedUrl(i.ImagePreview, WasabiImageFolder.items),
                        BuyLink = i.BuyLink,
                        Color = i.Color,
                        DisplayOrder = i.DisplayOrder
                    })
                    .ToList()
            };

            return response;
        }

        /// <summary>
        /// Create public outfit (Admin)
        /// </summary>
        public async Task<int> CreatePublicOutfitAsync(PublicOutfitCreateRequest request)
        {
            string? fileName = null;

            if (request.ImageFile != null && request.ImageFile.Length > 0)
            {
                fileName = await UploadImageAsync(request.ImageFile, WasabiImageFolder.items);
            }
            var outfit = new PublicCollectionOutfit
            {
                Name = request.Name,
                Description = request.Description,
                ImagePreview = fileName,
                IsActive = request.IsActive,
                DisplayOrder = request.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            };

            if (request.Seasons != null && request.Seasons.Any())
            {
                foreach (var season in request.Seasons)
                {
                    outfit.PublicOutfitSeasons.Add(new PublicOutfitSeason { SeasonName = season });
                }
            }

            _context.PublicCollectionOutfits.Add(outfit);
            await _context.SaveChangesAsync();

            return outfit.Id;
        }

        /// <summary>
        /// Update public outfit (Admin)
        /// </summary>
        public async Task<bool> UpdatePublicOutfitAsync(int outfitId, PublicOutfitUpdateRequest request)
        {
            var outfit = await _context.PublicCollectionOutfits
                .Include(o => o.PublicOutfitSeasons)
                .FirstOrDefaultAsync(o => o.Id == outfitId);

            if (outfit == null)
                return false;

            if (request.ImageFile != null && request.ImageFile.Length > 0)
            {
                // Delete old image
                if (!string.IsNullOrEmpty(outfit.ImagePreview))
                {
                    try
                    {
                        await _wasabiS3Service.DeleteFileAsync(outfit.ImagePreview, WasabiImageFolder.items);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete old image: {ex.Message}");
                    }
                }

                // Upload new image
                outfit.ImagePreview = await UploadImageAsync(request.ImageFile, WasabiImageFolder.items);
            }

            if (!string.IsNullOrEmpty(request.Name))
                outfit.Name = request.Name;
            if (request.Description != null)
                outfit.Description = request.Description;
            if (request.IsActive.HasValue)
                outfit.IsActive = request.IsActive.Value;
            if (request.DisplayOrder.HasValue)
                outfit.DisplayOrder = request.DisplayOrder.Value;

            outfit.UpdatedAt = DateTime.UtcNow;

            // Update seasons
            if (request.Seasons != null)
            {
                _context.PublicOutfitSeasons.RemoveRange(outfit.PublicOutfitSeasons);
                foreach (var season in request.Seasons)
                {
                    outfit.PublicOutfitSeasons.Add(new PublicOutfitSeason
                    {
                        OutfitId = outfitId,
                        SeasonName = season
                    });
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Delete public outfit (Admin)
        /// </summary>
        public async Task<bool> DeletePublicOutfitAsync(int outfitId)
        {
            var outfit = await _context.PublicCollectionOutfits
                .Include(o => o.PublicCollectionItems)
                .Include(o => o.PublicOutfitSeasons)
                .FirstOrDefaultAsync(o => o.Id == outfitId);

            if (outfit == null)
                return false;

            // Delete outfit image
            if (!string.IsNullOrEmpty(outfit.ImagePreview))
            {
                try
                {
                    await _wasabiS3Service.DeleteFileAsync(outfit.ImagePreview, WasabiImageFolder.items);
                }
                catch { }
            }

            // Delete all item images
            foreach (var item in outfit.PublicCollectionItems)
            {
                if (!string.IsNullOrEmpty(item.ImagePreview))
                {
                    try
                    {
                        await _wasabiS3Service.DeleteFileAsync(item.ImagePreview, WasabiImageFolder.items);
                    }
                    catch { }
                }
            }

            _context.PublicCollectionOutfits.Remove(outfit);
            await _context.SaveChangesAsync();

            return true;
        }

        #endregion

        #region Public Item CRUD (Admin)


        /// <summary>
        /// Get all items for a public outfit (Admin)
        /// </summary>
        public async Task<List<PublicItemResponseModel>> GetPublicOutfitItemsAsync(int outfitId)
        {
            var items = await _context.PublicCollectionItems
                .Where(i => i.OutfitId == outfitId)
                .OrderBy(i => i.DisplayOrder)
                .ToListAsync();

            return items.Select(i => new PublicItemResponseModel
            {
                Id = i.Id,
                Name = i.Name,
                ImageUrl = _wasabiS3Service.GetPreSignedUrl(i.ImagePreview, WasabiImageFolder.items),
                BuyLink = i.BuyLink,
                Color = i.Color,
                DisplayOrder = i.DisplayOrder
            }).ToList();
        }

        /// <summary>
        /// Add item to public outfit (Admin)
        /// </summary>
        public async Task<int> AddItemToPublicOutfitAsync(int outfitId, PublicItemCreateRequest request)
        {
            // Verify outfit exists
            var outfit = await _context.PublicCollectionOutfits.FindAsync(outfitId);
            if (outfit == null)
                throw new ArgumentException("Public outfit not found");

            string? fileName = null;

            if (request.ImageFile != null && request.ImageFile.Length > 0)
            {
                fileName = await UploadImageAsync(request.ImageFile, WasabiImageFolder.items);
            }
            else
            {
                throw new ArgumentException("Image file is required");
            }

            var item = new PublicCollectionItem
            {
                OutfitId = outfitId,
                Name = request.Name,
                ImagePreview = fileName,
                BuyLink = request.BuyLink,
                Color = request.Color,
                DisplayOrder = request.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            };

            _context.PublicCollectionItems.Add(item);
            await _context.SaveChangesAsync();

            return item.Id;
        }

        /// <summary>
        /// Update public item (Admin)
        /// </summary>
        public async Task<bool> UpdatePublicItemAsync(int itemId, PublicItemUpdateRequest request)
        {
            var item = await _context.PublicCollectionItems.FindAsync(itemId);
            if (item == null)
                return false;

            if (request.ImageFile != null && request.ImageFile.Length > 0)
            {
                // Delete old image
                if (!string.IsNullOrEmpty(item.ImagePreview))
                {
                    try
                    {
                        await _wasabiS3Service.DeleteFileAsync(item.ImagePreview, WasabiImageFolder.items);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete old item image: {ex.Message}");
                    }
                }

                // Upload new image
                item.ImagePreview = await UploadImageAsync(request.ImageFile, WasabiImageFolder.items);
            }

            if (!string.IsNullOrEmpty(request.Name))
                item.Name = request.Name;
            if (request.BuyLink != null)
                item.BuyLink = request.BuyLink;
            if (request.Color != null)
                item.Color = request.Color;
            if (request.DisplayOrder.HasValue)
                item.DisplayOrder = request.DisplayOrder.Value;

            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Delete public item (Admin)
        /// </summary>
        public async Task<bool> DeletePublicItemAsync(int itemId)
        {
            var item = await _context.PublicCollectionItems.FindAsync(itemId);
            if (item == null)
                return false;

            // Delete image from S3
            if (!string.IsNullOrEmpty(item.ImagePreview))
            {
                try
                {
                    await _wasabiS3Service.DeleteFileAsync(item.ImagePreview, WasabiImageFolder.items);
                }
                catch { }
            }

            _context.PublicCollectionItems.Remove(item);
            await _context.SaveChangesAsync();

            return true;
        }

        #endregion

        #region Save to Wardrobe (User)

        /// <summary>
        /// Save entire public outfit to user's wardrobe
        /// </summary>
        public async Task<int> SavePublicOutfitToWardrobeAsync(int userId, SavePublicOutfitToWardrobeRequest request)
        {
            var publicOutfit = await _context.PublicCollectionOutfits
                .Include(o => o.PublicCollectionItems)
                .Include(o => o.PublicOutfitSeasons)
                .FirstOrDefaultAsync(o => o.Id == request.PublicOutfitId);

            if (publicOutfit == null)
                throw new ArgumentException("Public outfit not found");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            // Download and re-upload the outfit image to user's outfits folder
            string outfitFileName;
            try
            {
                using var sourceStream = await _wasabiS3Service.DownloadFileAsync(
                    publicOutfit.ImagePreview,
                    WasabiImageFolder.items);

                using var webpStream = await ImageConverter.ConvertToWebP(sourceStream);
                var newFileName = $"{Guid.NewGuid()}.webp";

                await _wasabiS3Service.UploadFileAsync(
                    webpStream,
                    newFileName,
                    "image/webp",
                    WasabiImageFolder.items
                );

                outfitFileName = newFileName;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to copy outfit image: {ex.Message}", ex);
            }

            // Create outfit in user's wardrobe
            var outfit = new Outfit
            {
                UserId = userId,
                Name = request.CustomName ?? publicOutfit.Name,
                ImagePreview = outfitFileName,
                JsonTemplate = "{\"version\":\"5.3.0\",\"objects\":[]}", // Empty template
                IsPublic = false,
                IsFavorite = false,
                Comment = $"From public collection: {publicOutfit.Name}",
                CreatedAt = DateTime.UtcNow
            };

            // Copy seasons
            foreach (var season in publicOutfit.PublicOutfitSeasons)
            {
                outfit.OutfitSeasons.Add(new OutfitSeason { SeasonName = season.SeasonName });
            }

            _context.Outfits.Add(outfit);
            user.OutfitUploadCount = (user.OutfitUploadCount ?? 0) + 1;

            await _context.SaveChangesAsync();

            return outfit.Id;
        }

        /// <summary>
        /// Save individual public item to user's wardrobe
        /// </summary>
        public async Task<int> SavePublicItemToWardrobeAsync(int userId, SavePublicItemToWardrobeRequest request)
        {
            var publicItem = await _context.PublicCollectionItems.FindAsync(request.PublicItemId);
            if (publicItem == null)
                throw new ArgumentException("Public item not found");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            // Download and re-upload the item image to user's items folder
            string itemFileName;
            try
            {
                using var sourceStream = await _wasabiS3Service.DownloadFileAsync(
                    publicItem.ImagePreview,
                    WasabiImageFolder.items);

                using var webpStream = await ImageConverter.ConvertToWebP(sourceStream);
                var newFileName = $"{Guid.NewGuid()}.webp";

                await _wasabiS3Service.UploadFileAsync(
                    webpStream,
                    newFileName,
                    "image/webp",
                    WasabiImageFolder.items
                );

                itemFileName = newFileName;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to copy item image: {ex.Message}", ex);
            }

            // Create item in user's wardrobe
            var item = new Item
            {
                UserId = userId,
                CategoryCode = request.CategoryName ?? publicItem.Name,
                ImagePreview = itemFileName,
                IsPublic = false,
                IsFavorite = false,
                Comment = publicItem.BuyLink, // Store buy link in comment
                CreatedAt = DateTime.UtcNow
            };

            // Add seasons
            if (request.Seasons != null && request.Seasons.Any())
            {
                foreach (var season in request.Seasons)
                {
                    item.ItemSeasons.Add(new ItemSeason { SeasonName = season });
                }
            }
            else
            {
                // Default to "All year round"
                item.ItemSeasons.Add(new ItemSeason { SeasonName = "All year round" });
            }

            // Add color
            if (!string.IsNullOrEmpty(publicItem.Color))
            {
                item.ItemColors.Add(new ItemColor { ColorName = publicItem.Color });
            }

            _context.Items.Add(item);
            user.ItemUploadCount = (user.ItemUploadCount ?? 0) + 1;

            await _context.SaveChangesAsync();

            return item.Id;
        }

        #endregion

        #region Helpers

        private PublicOutfitResponseModel MapToResponse(PublicCollectionOutfit outfit)
        {
            return new PublicOutfitResponseModel
            {
                Id = outfit.Id,
                Name = outfit.Name,
                Description = outfit.Description,
              //  ImageUrl = _wasabiS3Service.GetPreSignedUrl(outfit.ImagePreview, WasabiImageFolder.items),
                IsActive = outfit.IsActive,
                DisplayOrder = outfit.DisplayOrder,
                Seasons = outfit.PublicOutfitSeasons.Select(s => s.SeasonName).ToList(),
                Items = outfit.PublicCollectionItems
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new PublicItemResponseModel
                    {
                        Id = i.Id,
                        Name = i.Name ?? string.Empty,
                        ImageUrl = _wasabiS3Service.GetPreSignedUrl(i.ImagePreview, WasabiImageFolder.items),
                        BuyLink = i.BuyLink,
                        Color = i.Color,
                        DisplayOrder = i.DisplayOrder
                    })
                    .ToList(),
                CreatedAt = outfit.CreatedAt,
                UpdatedAt = outfit.UpdatedAt
            };
        }

        private async Task<string> UploadImageAsync(IFormFile imageFile, WasabiImageFolder folder)
        {
            using var inputStream = imageFile.OpenReadStream();
            using var webpStream = await ImageConverter.ConvertToWebP(inputStream);

            var fileName = $"{Guid.NewGuid()}.webp";

            await _wasabiS3Service.UploadFileAsync(
                webpStream,
                fileName,
                "image/webp",
                folder
            );

            return fileName;
        }

        #endregion
    }
}