using GuEmLaAI.Services;
using Microsoft.AspNetCore.Mvc;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;
using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WasabiController : ControllerBase
    {
        private readonly WasabiS3Service _wasabiService;
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private const int URL_EXPIRY_MINUTES = 60;

        public WasabiController(WasabiS3Service wasabiService, IAmazonS3 s3Client, IConfiguration configuration)
        {
            _wasabiService = wasabiService;
            _s3Client = s3Client;
            _bucketName = configuration["Wasabi:BucketName"];
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                using var stream = file.OpenReadStream();
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                
                var url = await _wasabiService.UploadFileAsync(
                    stream,
                    fileName,
                    file.ContentType,
                    WasabiImageFolder.items
                );

                var preSignedUrl = _wasabiService.GetPreSignedUrl(fileName, WasabiImageFolder.items);

                return Ok(new { 
                    fileName = fileName,
                    url = preSignedUrl 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize]
        [HttpGet("images")]
        public async Task<IActionResult> GetImages()
        {
            try
            {
                var request = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    Prefix = WasabiImageFolder.items.ToString() + "/"
                };

                var result = await _s3Client.ListObjectsV2Async(request);
                var imagesWithPreSignedUrls = result.S3Objects.Select(obj => new
                {
                    key = obj.Key.Replace(WasabiImageFolder.items + "/", ""),
                    url = _wasabiService.GetPreSignedUrl(
                        obj.Key.Replace(WasabiImageFolder.items + "/", ""),
                        WasabiImageFolder.items
                    ),
                    lastModified = obj.LastModified,
                    size = obj.Size
                }).ToList();

                return Ok(imagesWithPreSignedUrls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("presigned-url/{fileName}")]
        public IActionResult GetPreSignedUrl(string fileName, [FromQuery] WasabiImageFolder folder = WasabiImageFolder.items)
        {
            try
            {
                var url = _wasabiService.GetPreSignedUrl(fileName, folder);
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("upload-url")]
        public IActionResult GetUploadPreSignedUrl(
            [FromQuery] string fileName, 
            [FromQuery] string contentType,
            [FromQuery] WasabiImageFolder folder = WasabiImageFolder.items)
        {
            try
            {
                var (url, newFileName) = _wasabiService.GetUploadPreSignedUrl(fileName, contentType, folder);
                return Ok(new { url, fileName = newFileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize]
        [HttpDelete("{fileName}")]
        public async Task<IActionResult> DeleteImage(string fileName, [FromQuery] WasabiImageFolder folder = WasabiImageFolder.items)
        {
            try
            {
                await _wasabiService.DeleteFileAsync(fileName, folder);
                return Ok(new { message = "File deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
