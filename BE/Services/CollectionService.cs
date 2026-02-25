using AutoMapper;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Collection;
using GuEmLaAI.BusinessObjects.ResponseModels.Collection;
using GuEmLaAI.BusinessObjects.ResponseModels.Outfit;
using GuEmLaAI.Helper;
using Microsoft.EntityFrameworkCore;

namespace GuEmLaAI.Services
{
    public class CollectionService
    {
        private readonly GuEmLaAiContext _context;
        private readonly IMapper _mapper;
        private readonly WasabiS3Service _wasabiS3Service;

        public CollectionService(GuEmLaAiContext context, IMapper mapper, WasabiS3Service wasabiS3Service)
        {
            _context = context;
            _mapper = mapper;
            _wasabiS3Service = wasabiS3Service;
        }

        public async Task<CollectionResponseModel?> CreateCollectionAsync(int userId, CreateCollectionRequest request)
        {
            try
            {
                var collection = new BusinessObjects.Models.Collection
                {
                    UserId = userId,
                    Name = request.Name,
                    Description = request.Description,
                    IsPublic = request.IsPublic,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Handle image upload if provided
                if (request.ImageCoverFile != null && request.ImageCoverFile.Length > 0)
                {
                    using var inputStream = request.ImageCoverFile.OpenReadStream();
                    using var webpStream = await ImageConverter.ConvertToWebP(inputStream);
                    var fileName = $"collection_{userId}_{Guid.NewGuid()}.webp";

                    await _wasabiS3Service.UploadFileAsync(webpStream, fileName, "image/webp", WasabiImageFolder.items);
                    collection.ImageCover = fileName;
                }

                await _context.Collections.AddAsync(collection);
                await _context.SaveChangesAsync();

                return await GetCollectionByIdAsync(collection.Id, userId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating collection: {ex.Message}");
                return null;
            }
        }

        public async Task<CollectionResponseModel?> GetCollectionByIdAsync(int collectionId, int? userId = null)
        {
            var collection = await _context.Collections
                .Include(c => c.CollectionOutfits)
                .FirstOrDefaultAsync(c => c.Id == collectionId);

            if (collection == null)
                return null;

            // Check access: owner can always view, others can only view public collections
            if (!collection.IsPublic && (userId == null || collection.UserId != userId))
                return null;

            var response = new CollectionResponseModel
            {
                Id = collection.Id,
                UserId = collection.UserId,
                Name = collection.Name,
                Description = collection.Description,
                ImageCover = collection.ImageCover,
                ImageCoverUrl = !string.IsNullOrEmpty(collection.ImageCover)
                    ? _wasabiS3Service.GetPreSignedUrl(collection.ImageCover, WasabiImageFolder.items)
                    : null,
                IsPublic = collection.IsPublic,
                CreatedAt = collection.CreatedAt,
                UpdatedAt = collection.UpdatedAt,
                OutfitCount = collection.CollectionOutfits.Count
            };

            return response;
        }

        public async Task<CollectionDetailResponseModel?> GetCollectionDetailsAsync(int collectionId, int? userId = null)
        {
            var collection = await _context.Collections
                .Include(c => c.CollectionOutfits)
                    .ThenInclude(co => co.Outfit)
                    .ThenInclude(o => o.OutfitSeasons)
                .FirstOrDefaultAsync(c => c.Id == collectionId);

            if (collection == null)
                return null;

            // Check access
            if (!collection.IsPublic && (userId == null || collection.UserId != userId))
                return null;

            var response = new CollectionDetailResponseModel
            {
                Id = collection.Id,
                UserId = collection.UserId,
                Name = collection.Name,
                Description = collection.Description,
                ImageCover = collection.ImageCover,
                ImageCoverUrl = !string.IsNullOrEmpty(collection.ImageCover)
                    ? _wasabiS3Service.GetPreSignedUrl(collection.ImageCover, WasabiImageFolder.items)
                    : null,
                IsPublic = collection.IsPublic,
                CreatedAt = collection.CreatedAt,
                UpdatedAt = collection.UpdatedAt,
                Outfits = collection.CollectionOutfits
                    .OrderByDescending(co => co.AddedAt)
                    .Select(co => new OutfitResponseModel
                    {
                        Id = co.Outfit.Id,
                        Name = co.Outfit.Name,
                        ImagePreview = co.Outfit.ImagePreview,
                        ImageUrl = !string.IsNullOrEmpty(co.Outfit.ImagePreview)
                            ? _wasabiS3Service.GetPreSignedUrl(co.Outfit.ImagePreview, WasabiImageFolder.items)
                            : null,
                        IsPublic = co.Outfit.IsPublic,
                        IsFavorite = co.Outfit.IsFavorite,
                        Comment = co.Outfit.Comment,
                        CreatedAt = co.Outfit.CreatedAt,
                        UpdatedAt = co.Outfit.UpdatedAt,
                        OutfitSeasons = co.Outfit.OutfitSeasons.Select(os => os.SeasonName).ToList(),
                        JsonTemplate = co.Outfit.JsonTemplate
                    })
                    .ToList()
            };

            return response;
        }

        public async Task<List<CollectionResponseModel>> GetUserCollectionsAsync(int userId, bool includePrivate = true)
        {
            var query = _context.Collections
                .Include(c => c.CollectionOutfits)
                .Where(c => c.UserId == userId);

            if (!includePrivate)
                query = query.Where(c => c.IsPublic);

            var collections = await query
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();

            return collections.Select(c => new CollectionResponseModel
            {
                Id = c.Id,
                UserId = c.UserId,
                Name = c.Name,
                Description = c.Description,
                ImageCover = c.ImageCover,
                ImageCoverUrl = !string.IsNullOrEmpty(c.ImageCover)
                    ? _wasabiS3Service.GetPreSignedUrl(c.ImageCover, WasabiImageFolder.items)
                    : null,
                IsPublic = c.IsPublic,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                OutfitCount = c.CollectionOutfits.Count
            }).ToList();
        }

        public async Task<List<CollectionResponseModel>> GetPublicCollectionsAsync(int pageNumber = 1, int pageSize = 20)
        {
            var collections = await _context.Collections
                .Include(c => c.CollectionOutfits)
                .Where(c => c.IsPublic)
                .OrderByDescending(c => c.UpdatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return collections.Select(c => new CollectionResponseModel
            {
                Id = c.Id,
                UserId = c.UserId,
                Name = c.Name,
                Description = c.Description,
                ImageCover = c.ImageCover,
                ImageCoverUrl = !string.IsNullOrEmpty(c.ImageCover)
                    ? _wasabiS3Service.GetPreSignedUrl(c.ImageCover, WasabiImageFolder.items)
                    : null,
                IsPublic = c.IsPublic,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                OutfitCount = c.CollectionOutfits.Count
            }).ToList();
        }

        public async Task<CollectionResponseModel?> UpdateCollectionAsync(int collectionId, int userId, UpdateCollectionRequest request)
        {
            try
            {
                var collection = await _context.Collections.FindAsync(collectionId);

                if (collection == null || collection.UserId != userId)
                    return null;

                // Update fields if provided
                if (!string.IsNullOrWhiteSpace(request.Name))
                    collection.Name = request.Name;

                if (request.Description != null)
                    collection.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description;

                if (request.IsPublic.HasValue)
                    collection.IsPublic = request.IsPublic.Value;

                // Handle image upload if provided
                if (request.ImageCoverFile != null && request.ImageCoverFile.Length > 0)
                {
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(collection.ImageCover))
                    {
                        try
                        {
                            await _wasabiS3Service.DeleteFileAsync(collection.ImageCover, WasabiImageFolder.items);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Warning: Failed to delete old collection image '{collection.ImageCover}': {ex.Message}");
                        }
                    }

                    // Upload new image
                    using var inputStream = request.ImageCoverFile.OpenReadStream();
                    using var webpStream = await ImageConverter.ConvertToWebP(inputStream);
                    var fileName = $"collection_{userId}_{Guid.NewGuid()}.webp";

                    await _wasabiS3Service.UploadFileAsync(webpStream, fileName, "image/webp", WasabiImageFolder.items);
                    collection.ImageCover = fileName;
                }

                collection.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return await GetCollectionByIdAsync(collectionId, userId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating collection: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> DeleteCollectionAsync(int collectionId, int userId)
        {
            try
            {
                var collection = await _context.Collections.FindAsync(collectionId);

                if (collection == null || collection.UserId != userId)
                    return false;

                // Delete image if exists
                if (!string.IsNullOrEmpty(collection.ImageCover))
                {
                    try
                    {
                        await _wasabiS3Service.DeleteFileAsync(collection.ImageCover, WasabiImageFolder.items);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete collection image '{collection.ImageCover}': {ex.Message}");
                    }
                }

                _context.Collections.Remove(collection);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting collection: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> AddOutfitToCollectionAsync(int collectionId, int userId, int outfitId)
        {
            try
            {
                var collection = await _context.Collections.FindAsync(collectionId);
                if (collection == null || collection.UserId != userId)
                    return false;

                var outfit = await _context.Outfits.FindAsync(outfitId);
                if (outfit == null)
                    return false;

                // Check if outfit belongs to user or is public
                if (outfit.UserId != userId && !outfit.IsPublic)
                    return false;

                // Check if outfit is already in collection
                var exists = await _context.CollectionOutfits
                    .AnyAsync(co => co.CollectionId == collectionId && co.OutfitId == outfitId);

                if (exists)
                    return false;

                var collectionOutfit = new CollectionOutfit
                {
                    CollectionId = collectionId,
                    OutfitId = outfitId,
                    AddedAt = DateTime.UtcNow
                };

                await _context.CollectionOutfits.AddAsync(collectionOutfit);

                collection.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding outfit to collection: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> RemoveOutfitFromCollectionAsync(int collectionId, int userId, int outfitId)
        {
            try
            {
                var collection = await _context.Collections.FindAsync(collectionId);
                if (collection == null || collection.UserId != userId)
                    return false;

                var collectionOutfit = await _context.CollectionOutfits
                    .FirstOrDefaultAsync(co => co.CollectionId == collectionId && co.OutfitId == outfitId);

                if (collectionOutfit == null)
                    return false;

                _context.CollectionOutfits.Remove(collectionOutfit);

                collection.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing outfit from collection: {ex.Message}");
                return false;
            }
        }
    }
}
