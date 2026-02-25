using Azure.Core;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.OutfitSuggest;
using GuEmLaAI.Helper;
using GuEmLaAI.Services;
using GuEmLaAI.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Identity.Client;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Linq;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkshopController : ControllerBase
    {
        private readonly GeminiHelper _geminiService;
        private readonly FashnHelper _fashnService;
        private readonly WasabiS3Service _wasabiService;
        private readonly GuEmLaAiContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly OutfitSuggestService _outfitSuggestService;

        public WorkshopController(
            GeminiHelper geminiService, 
            FashnHelper fashnService, 
            WasabiS3Service wasabiService,
            GuEmLaAiContext context,
            IHubContext<NotificationHub> hubContext,
            OutfitSuggestService outfitSuggestService)
        {
            _geminiService = geminiService ?? throw new ArgumentNullException(nameof(geminiService));
            _fashnService = fashnService ?? throw new ArgumentNullException(nameof(fashnService));
            _wasabiService = wasabiService;
            _context = context;
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _outfitSuggestService = outfitSuggestService ?? throw new ArgumentNullException(nameof(outfitSuggestService));
        }

        private int? GetCurrentUserId()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
                {
                    return parsedUserId;
                }
            }
            return null;
        }

        private async Task<(string fileName, string wasabiUrl)> ConvertAndUploadImage(Stream inputStream, WasabiImageFolder folder = WasabiImageFolder.items)
        {
            // Convert to WebP using the helper
            using var webpStream = await ImageConverter.ConvertToWebP(inputStream);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}.webp";

            // Upload to Wasabi
            var wasabiUrl = await _wasabiService.UploadFileAsync(
                webpStream,
                fileName,
                "image/webp",
                folder
            );

            return (fileName, wasabiUrl);
        }

        private async Task<(string fileName, string wasabiUrl)> UploadImageWithoutConversion(byte[] imageBytes, WasabiImageFolder folder = WasabiImageFolder.items)
        {
            var format = Image.DetectFormat(imageBytes);
            var extension = format?.FileExtensions.FirstOrDefault() ?? "png";
            var contentType = format?.DefaultMimeType ?? "image/png";
            var fileName = $"{Guid.NewGuid()}.{extension}";

            using var stream = new MemoryStream(imageBytes);
            var wasabiUrl = await _wasabiService.UploadFileAsync(
                stream,
                fileName,
                contentType,
                folder
            );

            return (fileName, wasabiUrl);
        }

        [HttpPost("fashnTryOn")]
        public async Task<IActionResult> FashnTryOn([FromBody] FashnTryOnRequest req)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                // 1. Get the image URL from Fashn API
                var fashnImageUrl = await _fashnService.TryOnSingleAsync(
                    req.ModelBase64,
                    req.GarmentBase64,
                    req.Mode ?? "auto"
                );

                // 2. Download the image from Fashn API
                using var downloadedStream = await _fashnService.DownloadGeneratedImageAsync(fashnImageUrl);
                
                // 3. Convert to WebP and upload
                var (fileName, wasabiUrl) = await ConvertAndUploadImage(downloadedStream);

                // 4. Save to HistoryBoard
                var historyBoard = new HistoryBoard
                {
                    UserId = userId.Value,
                    Image = fileName,
                    CreatedAt = DateTime.UtcNow,
                    ExpiredAt = DateTime.UtcNow.AddDays(7) // Set expiry to 7 days from now
                };

                _context.HistoryBoards.Add(historyBoard);

                // Validate user existence
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.VirtualTryOnUsedCount = (user.VirtualTryOnUsedCount ?? 0) + 1;
                }

                await _context.SaveChangesAsync();

                //// Broadcast virtual try-on count update via SignalR
                //await _hubContext.Clients.Group($"user_{userId}")
                //    .SendAsync("ReceiveVirtualTryOnCountUpdate", new 
                //    { 
                //        count = user?.VirtualTryOnUsedCount ?? 0,
                //        timestamp = DateTime.UtcNow,
                //        type = "virtual_try_on"
                //    });

                // Get presigned URL
                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);


                return Ok(new {
                    imageUrl = presignedUrl,
                    fileName = fileName,
                    historyBoardId = historyBoard.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("multiTryOn")]
        public async Task<IActionResult> MultiTryOn([FromBody] TryOnRequest req)
        {
            return await HandleTryOn(req, GeminiHelper.DefaultVirtualTryOnPrompt);
        }

        [HttpPost("multiTryOnBG")]
        public async Task<IActionResult> MultiTryOnWithBackground([FromBody] TryOnRequest req)
        {
            return await HandleTryOn(req,
                "Model wears clothes from other images, on the last background.");
        }

        [HttpPost("backgroundGeminiImageGenerate")]
        public async Task<IActionResult> BackgroundGenerate([FromBody] TryOnRequest req)
        {
            try
            {
                return await HandleTryOnAndUploadOriginal(req, GeminiHelper.DefaultModelEnhancementPrompt_New);
            }
            catch (InvalidOperationException ex)
            {
                // Handle validation failures (e.g., image doesn't contain a human)
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("tryOnSuggested")]
        public async Task<IActionResult> TryOnSuggested([FromBody] TryOnRequest req)
        {
            try
            {
                req.Prompt = GeminiHelper.DefaultVirtualTryOnPrompt;
                // Generate image WITHOUT saving history - frontend will batch save later
                return await TryOnGenerateOnly(req);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("tryOnAdditionalSuggested")]
        public async Task<IActionResult> TryOnAdditionalSuggested([FromBody] TryOnRequest req)
        {
            try
            {
                var userQuery = req.UserQuery;
                req.Prompt = GeminiHelper.AdditionalSuggestionPrompt.Replace("${userPrompt}", userQuery);
                // Generate image WITHOUT saving history - frontend will batch save later
                return await TryOnGenerateOnly(req);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("poseVariation")]
        public async Task<IActionResult> PoseVariation([FromBody] PoseVariationRequest req)
        {
            var prompt = BuildPoseVariationPrompt(req.PoseInstruction);

            req.Prompt = prompt;
            return await HandlePoseVariation(req, prompt);
        }

        [HttpPost("modelPicture")]
        public async Task<IActionResult> SaveModelPicture([FromBody] ModelPictureRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.ImageBase64))
                {
                    return BadRequest(new { error = "Image data is required." });
                }

                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                byte[] imageBytes;
                try
                {
                    imageBytes = Convert.FromBase64String(CleanBase64(req.ImageBase64));
                }
                catch (FormatException)
                {
                    return BadRequest(new { error = "Invalid image format." });
                }

                using var imageStream = new MemoryStream(imageBytes);
                var (fileName, _) = await ConvertAndUploadImage(imageStream, WasabiImageFolder.items);

                var user = await _context.Users.FindAsync(userId.Value);
                if (user == null)
                    return NotFound(new { error = "User not found." });

                if (!string.IsNullOrEmpty(user.ModelPicture))
                {
                    try
                    {
                        await _wasabiService.DeleteFileAsync(user.ModelPicture, WasabiImageFolder.items);
                        Console.WriteLine($"Success upload model picture");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete previous model picture '{user.ModelPicture}': {ex.Message}");
                    }
                }

                user.ModelPicture = fileName;
                await _context.SaveChangesAsync();

                var imageUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                return Ok(new
                {
                    fileName,
                    imageUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{fileName}")]
        public async Task<IActionResult> DeleteModel(string fileName)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                if (string.IsNullOrWhiteSpace(fileName))
                    return BadRequest(new { error = "File name is required." });

                // Extract the actual filename if it's a presigned URL
                var actualFileName = ExtractFileNameFromUrl(fileName);

                // Find the model in the database
                var model = await _context.Models
                    .FirstOrDefaultAsync(m => m.ImageName == actualFileName && m.UserId == userId.Value);

                if (model == null)
                    return NotFound(new { error = "Model not found." });

                // Delete from database
                _context.Models.Remove(model);
                await _context.SaveChangesAsync();

                // Delete the image from Wasabi S3
                try
                {
                    await _wasabiService.DeleteFileAsync(actualFileName, WasabiImageFolder.items);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Failed to delete model image '{actualFileName}' from Wasabi S3: {ex.Message}");
                    // Continue - the database record is already deleted
                }

                return Ok(new { message = "Model deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }
        private static string ExtractFileNameFromUrl(string fileNameOrUrl)
        {
            // Check if it's a presigned URL (contains http/https)
            if (fileNameOrUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                fileNameOrUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                // Extract filename from URL path (e.g., /items/guid.webp from full URL)
                var uri = new Uri(fileNameOrUrl);
                var fileName = System.IO.Path.GetFileName(uri.LocalPath);
                return fileName;
            }

            // It's already just a filename
            return fileNameOrUrl;
        }

        private async Task<IActionResult> HandleTryOn(TryOnRequest req, string defaultPrompt)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });
                var user = await _context.Users.FindAsync(userId);

                //Check for daily limit
                if (user != null && user.TodayImageGeneratedCount >= user.MaxImageGenerated)
                {
                    return BadRequest(new { error = "Daily try-on generation limit reached." });
                }

                var prompt = string.IsNullOrWhiteSpace(req.Prompt) ? defaultPrompt : req.Prompt;

                // Get the base64 result from Gemini
                var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt, false, req.ClothingItemIds);

                
                byte[] imageBytes = Convert.FromBase64String(base64Result);
                using var imageStream = new MemoryStream(imageBytes);

                var (fileName, wasabiUrl) = await ConvertAndUploadImage(imageStream);

                // Build jsonTemplate from Images[1] onwards // Update this part to log the correct garment
                var jsonTemplateItems = new List<object>();

                if (req.OutfitStackItems != null && req.OutfitStackItems.Count > 0)
                {
                    for (int i = 0; i < req.OutfitStackItems.Count; i++)
                    {
                        var imageFileName = req.OutfitStackItems[i];

                        // Find the item in database by ImagePreview (filename)
                        var item = await _context.Items
                            .FirstOrDefaultAsync(x => x.ImagePreview == imageFileName && x.UserId == userId.Value);

                        if (item != null)
                        {
                            jsonTemplateItems.Add(new
                            {
                                id = item.Id,
                                image_preview = item.ImagePreview,
                                comment = item.Comment,
                                category_code = item.CategoryCode
                            });
                        }
                    }
                } else
                { // Fallback to previous logic if OutfitStackItems is not provided
                    for (int i = 1; i < req.Images.Count; i++)
                    {
                        var imageFileName = req.Images[i];
                        var item = await _context.Items
                            .FirstOrDefaultAsync(x => x.ImagePreview == imageFileName && x.UserId == userId.Value);
                        if (item != null)
                        {
                            jsonTemplateItems.Add(new
                            {
                                id = item.Id,
                                image_preview = item.ImagePreview,
                                comment = item.Comment,
                                category_code = item.CategoryCode
                            });
                        }
                    }
                }

                    var jsonTemplate = System.Text.Json.JsonSerializer.Serialize(jsonTemplateItems);

                var historyBoard = new HistoryBoard
                {
                    UserId = userId.Value,
                    Image = fileName,
                    CreatedAt = DateTime.UtcNow,
                    ExpiredAt = DateTime.UtcNow.AddDays(7),
                    ItemJsonTemplate = jsonTemplate  
                };

                _context.HistoryBoards.Add(historyBoard);

               
                if (user != null)
                {
                    user.VirtualTryOnUsedCount = (user.VirtualTryOnUsedCount ?? 0) + 1;
                    user.TodayImageGeneratedCount = (user.TodayImageGeneratedCount ?? 0) + 1;
                }

                await _context.SaveChangesAsync();

                // Get presigned URL
                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveImageGenerationCountUpdate", new 
                    { 
                        count = user?.TodayImageGeneratedCount ?? 0,
                        timestamp = DateTime.UtcNow,
                        type = "image_generation",
                        latestImageUrl = presignedUrl
                    });
               
                return Ok(new { 
                    imageUrl = presignedUrl,
                    fileName = fileName,
                    itemsTemplate = jsonTemplateItems,
                    historyBoardId = historyBoard.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        private async Task<IActionResult> HandlePoseVariation(TryOnRequest req, string defaultPrompt)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                if (req.Images == null || req.Images.Count == 0)
                    return BadRequest(new { error = "At least one image is required." });
                var user = await _context.Users.FindAsync(userId);

                //Check for daily limit
                if (user != null && user.TodayModelPictureCreatedCount >= user.MaxModelCreated)
                {
                    return BadRequest(new { error = "Daily pose generation limit reached." });
                }

                var prompt = string.IsNullOrWhiteSpace(req.Prompt) ? defaultPrompt : req.Prompt;
                
                // Get the base64 result from Gemini
                var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt, false, req.ClothingItemIds);

                byte[] imageBytes = Convert.FromBase64String(base64Result);
                using var imageStream = new MemoryStream(imageBytes);
                var (fileName, wasabiUrl) = await ConvertAndUploadImage(imageStream, WasabiImageFolder.items);

               
                if (user != null)
                {
                    user.VirtualTryOnUsedCount = (user.VirtualTryOnUsedCount ?? 0) + 1;
                    user.TodayModelPictureCreatedCount = (user.TodayModelPictureCreatedCount ?? 0) + 1;
                }
                else return NotFound(new { error = "User not found." });

                await _context.SaveChangesAsync(); //update the count immidately

                // Build jsonTemplate from Images[1] onwards
                var jsonTemplateItems = new List<object>();

                for (int i = 1; i < req.Images.Count; i++)
                {
                    var imageFileName = req.Images[i];
                    var item = await _context.Items
                        .FirstOrDefaultAsync(x => x.ImagePreview == imageFileName && x.UserId == userId.Value);

                    if (item != null)
                    {
                        jsonTemplateItems.Add(new
                        {
                            id = item.Id,
                            image_preview = item.ImagePreview,
                            comment = item.Comment,
                            category_code = item.CategoryCode
                        });
                    }
                }

                var jsonTemplate = System.Text.Json.JsonSerializer.Serialize(jsonTemplateItems);

                // Broadcast model picture count update via SignalR
                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveModelPictureCountUpdate", new
                    {
                        count = user.TodayModelPictureCreatedCount ?? 0,
                        timestamp = DateTime.UtcNow,
                        type = "model_picture"
                    });

                await _context.SaveChangesAsync();
                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                return Ok(new
                {
                    imageUrl = presignedUrl,
                    fileName = fileName,
                    itemsTemplate = jsonTemplateItems,
                    //historyBoardId = historyBoard.Id
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private async Task<IActionResult> HandleTryOnAndUpload(TryOnRequest req, string defaultPrompt)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                if (req.Images == null || req.Images.Count == 0)
                    return BadRequest(new { error = "At least one image is required." });

                var prompt = string.IsNullOrWhiteSpace(req.Prompt) ? defaultPrompt : req.Prompt;
                var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt, false, req.ClothingItemIds);
                
                byte[] imageBytes = Convert.FromBase64String(base64Result);
                using var imageStream = new MemoryStream(imageBytes);
                var (fileName, wasabiUrl) = await ConvertAndUploadImage(imageStream, WasabiImageFolder.items);

                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.TodayModelPictureCreatedCount = (user.TodayModelPictureCreatedCount ?? 0) + 1;
                }else 
               
                return NotFound(new { error = "User not found." });

                if (!string.IsNullOrEmpty(user.ModelPicture))
                {
                    try
                    {
                        await _wasabiService.DeleteFileAsync(user.ModelPicture, WasabiImageFolder.items);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete previous model picture '{user.ModelPicture}': {ex.Message}");
                    }
                }

                user.ModelPicture = fileName;
                    
                await _context.SaveChangesAsync();

                // Broadcast model picture count update via SignalR
                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveModelPictureCountUpdate", new 
                    { 
                        count = user.TodayModelPictureCreatedCount ?? 0,
                        timestamp = DateTime.UtcNow,
                        type = "model_picture"
                    });

                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                return Ok(new
                {
                    imageBase64 = base64Result,
                    mimeType = "image/png",
                    imageUrl = presignedUrl,
                    fileName = fileName
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private async Task<IActionResult> HandleTryOnAndUploadOriginal(TryOnRequest req, string defaultPrompt)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                var user = await _context.Users.FindAsync(userId);

                //Check for max model images size (6)

                var modelCount = await _context.Models.CountAsync(m => m.UserId == userId.Value);
                if (user != null && modelCount >= 6 )
                {
                    return BadRequest(new { error = "Maximum amount of Models reached." });
                }

                //Check for daily limit
                if (user != null && user.TodayModelPictureCreatedCount >= user.MaxModelCreated)
                {
                    return BadRequest(new { error = "Daily pose generation limit reached." });
                }

                if (req.Images == null || req.Images.Count == 0)
                    return BadRequest(new { error = "At least one image is required." });

                var prompt = string.IsNullOrWhiteSpace(req.Prompt) ? defaultPrompt : req.Prompt;
                var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt, false, req.ClothingItemIds);

                byte[] imageBytes = Convert.FromBase64String(base64Result);

                // Upload without converting so we keep original quality/format
                var (fileName, wasabiUrl) = await UploadImageWithoutConversion(imageBytes, WasabiImageFolder.items);

                if (user != null)
                {
                    user.TodayModelPictureCreatedCount = (user.TodayModelPictureCreatedCount ?? 0) + 1;
                }
                else
                {
                    return NotFound(new { error = "User not found." });
                }

                if (!string.IsNullOrEmpty(user.ModelPicture))
                {
                    try
                    {
                        //await _wasabiService.DeleteFileAsync(user.ModelPicture, WasabiImageFolder.items);
                        user.ModelPicture = fileName;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to delete previous model picture '{user.ModelPicture}': {ex.Message}");
                    }
                }
                else
                {
                    // Ensure model_picture column is updated with the new image name when none existed before
                    user.ModelPicture = fileName;
                }


                user.Models.Add(new Model
                {
                    UserId = userId.Value,
                    ImageName = fileName,
                });

                await _context.SaveChangesAsync();

                // Broadcast model picture count update via SignalR
                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveModelPictureCountUpdate", new
                    {
                        count = user.TodayModelPictureCreatedCount ?? 0,
                        timestamp = DateTime.UtcNow,
                        type = "model_picture"
                    });

                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                return Ok(new
                {
                    imageBase64 = base64Result,
                    mimeType = "image/png",
                    imageUrl = presignedUrl,
                    fileName = fileName
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        //private async Task<IActionResult> HandleTryOnWithoutUpload(TryOnRequest req, string defaultPrompt)
        //{
        //    try
        //    {
        //        var userId = GetCurrentUserId();
        //        if (!userId.HasValue)
        //            return Unauthorized(new { error = "User not authenticated." });

        //        if (req.Images == null || req.Images.Count == 0)
        //            return BadRequest(new { error = "At least one image is required." });

        //        var prompt = string.IsNullOrWhiteSpace(req.Prompt) ? defaultPrompt : req.Prompt;
        //        var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt);

        //        return Ok(new
        //        {
        //            imageBase64 = base64Result,
        //            mimeType = "image/png"
        //        });
        //    }
        //    catch (ArgumentException ex)
        //    {
        //        return BadRequest(new { error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        private static string BuildPoseVariationPrompt(string? poseInstruction)
        {
            var instruction = string.IsNullOrWhiteSpace(poseInstruction)
                ? "Full frontal view, hands on hips"
                : poseInstruction.Trim();

            return $"You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical, and the subject must remain full-body from head to toe. The new perspective should be (described in Vietnamese): \"{instruction}\". Return ONLY the final image.";
        }

        private static string CleanBase64(string base64)
        {
            if (string.IsNullOrWhiteSpace(base64))
            {
                return string.Empty;
            }

            var commaIndex = base64.IndexOf(',');
            return commaIndex >= 0 ? base64[(commaIndex + 1)..] : base64;
        }

        /// <summary>
        /// Generate try-on image WITHOUT saving to history.
        /// Used by the 3-option suggestion flow - frontend will batch save after all 3 complete.
        /// </summary>
        private async Task<IActionResult> TryOnGenerateOnly([FromBody] TryOnRequest req)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized(new { error = "User not authenticated." });

                var user = await _context.Users.FindAsync(userId);

                // Check for daily limit
                if (user != null && user.TodayImageGeneratedCount >= user.MaxImageGenerated)
                {
                    return BadRequest(new { error = "Daily try-on generation limit reached." });
                }

                var prompt = string.IsNullOrWhiteSpace(req.Prompt) 
                    ? throw new ArgumentException("Prompt is required for try-on suggestion.")
                    : req.Prompt;

                // Get the base64 result from Gemini
                var base64Result = await _geminiService.GetVirtualTryOnAsync(req.Images, prompt, false, req.ClothingItemIds);

                byte[] imageBytes = Convert.FromBase64String(base64Result);
                using var imageStream = new MemoryStream(imageBytes);

                var (fileName, wasabiUrl) = await ConvertAndUploadImage(imageStream);

                var presignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                // Update user's usage count
                if (user != null)
                {
                    user.VirtualTryOnUsedCount = (user.VirtualTryOnUsedCount ?? 0) + 1;
                    user.TodayImageGeneratedCount = (user.TodayImageGeneratedCount ?? 0) + 1;
                    await _context.SaveChangesAsync();
                }

                // Broadcast update via SignalR
                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveImageGenerationCountUpdate", new
                    {
                        count = user?.TodayImageGeneratedCount ?? 0,
                        timestamp = DateTime.UtcNow,
                        type = "image_generation",
                        latestImageUrl = presignedUrl
                    });

                // Return image info WITHOUT saving to history
                return Ok(new
                {
                    imageUrl = presignedUrl,
                    fileName = fileName
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        public class TryOnRequest
        {
            public List<string> Images { get; set; } = new(); //[modelImage, clothImage1, clothImage2, ...]
            public List<int>? ClothingItemIds { get; set; }
            public string? UserQuery { get; set; }
            public string? Prompt { get; set; }
            public List<string>? OutfitStackItems { get; set; }
        }

        public class PoseVariationRequest : TryOnRequest
        {
            public string? PoseInstruction { get; set; }
        }

        public class ModelPictureRequest
        {
            public string ImageBase64 { get; set; } = string.Empty;
        }

        public class FashnTryOnRequest
        {
            public string ModelBase64 { get; set; } = "";
            public string GarmentBase64 { get; set; } = "";
            public string Mode { get; set; } = "";
        }
    }
}
