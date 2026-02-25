using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.ResponseModels.Board;
using GuEmLaAI.Helper;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BoardController : ControllerBase
    {
        private readonly GuEmLaAiContext _context;
        private readonly WasabiS3Service _wasabiService;

        public BoardController(GuEmLaAiContext context, WasabiS3Service wasabiService)
        {
            _context = context;
            _wasabiService = wasabiService; // Fixed assignment
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateBoard([FromBody] CreateBoardRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { error = "Title is required." });
            }

            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
                {
                    userId = parsedUserId;
                }
            }

            if (userId == null)
            {
                return Unauthorized(new { error = "User not authenticated." });
            }

            var board = new Board
            {
                OwnerId = userId.Value, 
                Title = request.Title,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow,
                Status = 1
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            return Ok(new BoardResponseModel
            {
                Id = board.Id,
                Title = board.Title,
                Description = board.Description,
                CreatedAt = board.CreatedAt,
                CoverImageId = null,
                CoverImageUrl = null
            });
        }

        [HttpPost("save-to-board")]
        public async Task<IActionResult> SaveImageToBoard(int boardId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null)
                return NotFound("Board not found");

            try
            {
                // Convert to WebP
                using var inputStream = file.OpenReadStream();
                using var webpStream = await ImageConverter.ConvertToWebP(inputStream);

                // Generate unique filename with .webp extension
                var fileName = $"{Guid.NewGuid()}.webp";
                
                // Upload to Wasabi S3
                var url = await _wasabiService.UploadFileAsync(
                    webpStream,
                    fileName,
                    "image/webp",
                    WasabiImageFolder.items 
                );

                // Create new board image
                var boardImage = new BoardImage
                {
                    BoardId = boardId,
                    Picture = fileName 
                };

                // Add to database
                _context.BoardImages.Add(boardImage);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    boardImageId = boardImage.Id,
                    fileName = fileName,
                    url = url
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpGet("{boardId}/images")]
        public async Task<IActionResult> GetBoardImages(int boardId, [FromQuery] int urlExpiryMinutes = 60)
        {
            var board = await _context.Boards
                .Include(b => b.BoardImages)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound("Board not found");

            var images = board.BoardImages.Select(bi => new
            {
                id = bi.Id,
                fileName = bi.Picture,
                url = _wasabiService.GetPreSignedUrl(bi.Picture, WasabiImageFolder.items, urlExpiryMinutes)
            }).ToList();

            return Ok(images);
        }

        [HttpGet("{userId}/boards")]
        public async Task<IActionResult> GetUserBoards(int userId, [FromQuery] int urlExpiryMinutes = 60)
        {
            // Get regular boards
            var boards = await _context.Boards
                .Include(b => b.BoardImages)
                .Where(b => b.OwnerId == userId && b.Status == 1)
                .Select(b => new BoardResponseModel
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    CreatedAt = b.CreatedAt,
                    CoverImageId = b.BoardImages.Any() ? b.BoardImages.First().Id : null,
                    CoverImageUrl = b.BoardImages.Any() 
                        ? _wasabiService.GetPreSignedUrl(b.BoardImages.First().Picture, WasabiImageFolder.items, urlExpiryMinutes)
                        : null
                })
                .ToListAsync();

            // Get the most recent history board
            var historyBoard = await _context.HistoryBoards
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new HistoryBoardResponseModel
                {
                    Id = b.Id,
                    UserId = b.UserId,
                    Image = b.Image,
                    ImageUrl = _wasabiService.GetPreSignedUrl(b.Image, WasabiImageFolder.items, urlExpiryMinutes),
                    CreatedAt = b.CreatedAt,
                    ExpiredAt = b.ExpiredAt
                })
                .FirstOrDefaultAsync();

            // Return combined response
            return Ok(new { 
                boards = boards,
                historyBoard = historyBoard
            });
        }

        [HttpGet("history/{userId}/images")]
        public async Task<IActionResult> GetHistoryBoardImages(int userId, [FromQuery] int urlExpiryMinutes = 60)
        {
            var historyBoards = await _context.HistoryBoards
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    id = b.Id,
                    fileName = b.Image,
                    url = _wasabiService.GetPreSignedUrl(b.Image, WasabiImageFolder.items, urlExpiryMinutes)
                })
                .ToListAsync();

            //if (!historyBoards.Any())
            //    return NotFound();

            return Ok(historyBoards);
        }

        [HttpGet("history/{id}")]
        public async Task<IActionResult> GetHistoryBoardImageInfoById(int id, [FromQuery] int urlExpiryMinutes = 60)
        {
            var historyBoard = await _context.HistoryBoards
                .Where(b => b.Id == id)
                .FirstOrDefaultAsync();

            if (historyBoard == null)
                return NotFound(new { error = "No history board found" });

            var response = new HistoryBoardDetailResponseModel
            {
                Id = historyBoard.Id,
                Url = _wasabiService.GetPreSignedUrl(historyBoard.Image, WasabiImageFolder.items),
                ItemsTemplate = ItemJsonTemplateHelper.DeserializeItemTemplate(historyBoard.ItemJsonTemplate, _wasabiService, urlExpiryMinutes)
            };

            return Ok(response);
        }

        [HttpGet("remove-board/{boardId}")]
        public async Task<IActionResult> RemoveBoard(int boardId)
        {
            var board = await _context.Boards
                .Include(b => b.BoardImages)
                .FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null)
                return NotFound("Board not found");
            else
            {
                board.Status = 0;
                _context.Boards.Update(board);
            }
                // Remove associated images first
                //_context.BoardImages.RemoveRange(board.BoardImages);
                // Then remove the board

                await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("remove-image/{imageId}")]
        public async Task<IActionResult> RemoveBoardImage(int imageId)
        {
            var boardImage = await _context.BoardImages
                .Include(bi => bi.Board)
                .FirstOrDefaultAsync(bi => bi.Id == imageId);

            if (boardImage == null)
                return NotFound("Image not found");

            try
            {
                // Delete the file from Wasabi S3
                await _wasabiService.DeleteFileAsync(boardImage.Picture, WasabiImageFolder.items);

                // If this image is set as the cover image for the board, clear the reference
                if (boardImage.Board.ImagePreview == imageId)
                {
                    boardImage.Board.ImagePreview = null;
                    _context.Boards.Update(boardImage.Board);
                }

                // Remove the board image from database
                _context.BoardImages.Remove(boardImage);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("save-url-to-board")]
        public async Task<IActionResult> SaveUrlToBoard(int boardId, [FromBody] string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return BadRequest("No URL provided");

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null)
                return NotFound("Board not found");

            try
            {
                // Create HttpClient to download the file
                using var httpClient = new HttpClient();
                using var response = await httpClient.GetAsync(imageUrl);
                
                if (!response.IsSuccessStatusCode)
                    return BadRequest("Failed to download image from URL");

                // Get the file content
                var contentStream = await response.Content.ReadAsStreamAsync();
                
                // Extract the original filename from the URL
                var uri = new Uri(imageUrl);
                var path = uri.AbsolutePath;
                var originalFileName = path.Substring(path.LastIndexOf('/') + 1);
                originalFileName = originalFileName.Split('?')[0]; // Remove query parameters

                // Generate a new unique filename
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(originalFileName)}";

                // Upload to Wasabi
                var url = await _wasabiService.UploadFileAsync(
                    contentStream,
                    fileName,
                    "image/png", // Since we know it's coming from our S3, we can assume it's a PNG
                    WasabiImageFolder.items
                );

                // Create new board image
                var boardImage = new BoardImage
                {
                    BoardId = boardId,
                    Picture = fileName
                };

                // Add to database
                _context.BoardImages.Add(boardImage);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    boardImageId = boardImage.Id,
                    fileName = fileName,
                    url = url
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }



    }

    public class CreateBoardRequest
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
    }
}
