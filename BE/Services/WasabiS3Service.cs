using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace GuEmLaAI.Services
{
    public enum WasabiImageFolder
    {
        //generated_images,
        //saved_images,
        items,
       // outfits,
        //outfit_items,
        //profile_pictures,
        //model_pictures,
       // collections
    }

    public class WasabiS3Service
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private const string WasabiEndpoint = "https://s3.ap-southeast-1.wasabisys.com";
        private const int URL_EXPIRY_MINUTES = 60;

        public WasabiS3Service(IConfiguration configuration)
        {
            var accessKey = configuration["Wasabi:AccessKey"];
            var secretKey = configuration["Wasabi:SecretKey"];
            _bucketName = configuration["Wasabi:BucketName"];

            var config = new AmazonS3Config
            {
                ServiceURL = WasabiEndpoint,
                ForcePathStyle = true,
                UseHttp = false,
                SignatureMethod = SigningAlgorithm.HmacSHA256
            };

            _s3Client = new AmazonS3Client(
                new BasicAWSCredentials(accessKey, secretKey),
                config
            );
        }

        private string GetFolderPath(WasabiImageFolder folder) => $"{folder}/";

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, WasabiImageFolder folder)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var folderPath = GetFolderPath(folder);
                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = folderPath + fileName,
                    InputStream = memoryStream,
                    ContentType = contentType,
                    AutoResetStreamPosition = true,
                    AutoCloseStream = true,
                    DisablePayloadSigning = true,
                    CannedACL = S3CannedACL.Private
                };

                putRequest.ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256;

                await _s3Client.PutObjectAsync(putRequest);

                return GetFileUrl(fileName, folder);
            }
            catch (AmazonS3Exception ex)
            {
                throw new Exception($"Error uploading file to Wasabi: {ex.Message}", ex);
            }
        }

        public async Task<Stream> DownloadFileAsync(string fileName, WasabiImageFolder folder)
        {
            try
            {
                var request = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = GetFolderPath(folder) + fileName
                };

                var response = await _s3Client.GetObjectAsync(request);
                return response.ResponseStream;
            }
            catch (AmazonS3Exception ex)
            {
                throw new Exception($"Error downloading file from Wasabi: {ex.Message}", ex);
            }
        }


        /// <summary>
        /// Downloads a file as Base64 from either 'items' or 'outfits' folder.
        /// Checks 'items' folder first, then falls back to 'outfits' folder if not found.
        /// </summary>
        public async Task<string> DownloadFileAsBase64FromWasabiFolderAsync(string fileName)
        {
            try
            {
                // Try generated_pictures folder first
                //if (await DoesFileExistAsync(fileName, WasabiImageFolder.generated_images))
                //{
                //    return await DownloadFileAsBase64Async(fileName, WasabiImageFolder.generated_images);
                //}
                // Try items folder first
                if (await DoesFileExistAsync(fileName, WasabiImageFolder.items))
                {
                    return await DownloadFileAsBase64Async(fileName, WasabiImageFolder.items);
                }

                // If not found in items, try outfits folder
                //if (await DoesFileExistAsync(fileName, WasabiImageFolder.outfits))
                //{
                //    return await DownloadFileAsBase64Async(fileName, WasabiImageFolder.outfits);
                //}

                // Try model_pictures folder first
                //if (await DoesFileExistAsync(fileName, WasabiImageFolder.model_pictures))
                //{
                //    return await DownloadFileAsBase64Async(fileName, WasabiImageFolder.model_pictures);
                //}

                // If not found in either folder
                throw new FileNotFoundException($"File '{fileName}' not found in folders.");
            }
            catch (FileNotFoundException ex)
            {
                throw ex;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error downloading file from items or outfits folder: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Downloads a file as Base64 from the specified folder.
        /// </summary>
        public async Task<string> DownloadFileAsBase64Async(string fileName, WasabiImageFolder folder)
        {
            try
            {
                var request = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = GetFolderPath(folder) + fileName
                };

                var response = await _s3Client.GetObjectAsync(request);

                // Convert stream to byte array
                using var memoryStream = new MemoryStream();
                await response.ResponseStream.CopyToAsync(memoryStream);

                // Convert bytes to Base64 string
                byte[] imageBytes = memoryStream.ToArray();
                return Convert.ToBase64String(imageBytes);
            }
            catch (AmazonS3Exception ex)
            {
                throw new Exception($"Error downloading file from Wasabi: {ex.Message}", ex);
            }
        }

        public async Task DeleteFileAsync(string fileName, WasabiImageFolder folder)
        {
            try
            {
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = GetFolderPath(folder) + fileName
                };

                await _s3Client.DeleteObjectAsync(deleteRequest);
            }
            catch (AmazonS3Exception ex)
            {
                throw new Exception($"Error deleting file from Wasabi: {ex.Message}", ex);
            }
        }

        public string GetFileUrl(string fileName, WasabiImageFolder folder)
        {
            return $"{WasabiEndpoint}/{_bucketName}/{GetFolderPath(folder)}{fileName}";
        }

        public async Task<bool> DoesFileExistAsync(string fileName, WasabiImageFolder folder)
        {
            try
            {
                var request = new GetObjectMetadataRequest
                {
                    BucketName = _bucketName,
                    Key = GetFolderPath(folder) + fileName
                };

                await _s3Client.GetObjectMetadataAsync(request);
                return true;
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
        }

        /// <summary>
        /// Checks if a file exists and was created today (UTC).
        /// Searches across generated_images, items, outfits, and model_pictures folders.
        /// </summary>
        public async Task<bool> IsModelPictureCreatedTodayAsync(string fileName)
        {
            var today = DateTime.UtcNow.Date;

                try
                {
                    var request = new GetObjectMetadataRequest
                    {
                        BucketName = _bucketName,
                        Key = GetFolderPath(WasabiImageFolder.items) + fileName
                    };

                    var response = await _s3Client.GetObjectMetadataAsync(request);
                    
                    // Get the LastModified date from metadata
                    var fileCreatedDate = response.LastModified?.Date;
                    
                    // Compare with today's date
                    if (fileCreatedDate == today)
                    {
                        return true;
                    }
                }
                catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                     return false;
                }

            return false;
        }

        public string GetPreSignedUrl(string fileName, WasabiImageFolder folder, int expiryMinutes = URL_EXPIRY_MINUTES)
        {
            try
            {
              
                var folderPath = GetFolderPath(folder);

                var key = folderPath + fileName;

                var expirationTime = DateTime.UtcNow.AddMinutes(expiryMinutes);

                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    Verb = HttpVerb.GET,
                    Expires = expirationTime
                };


                var presignedUrl = _s3Client.GetPreSignedURL(request);

            

                return presignedUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in GetPreSignedUrl: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public (string Url, string FileName) GetUploadPreSignedUrl(string fileName, string contentType, WasabiImageFolder folder, int expiryMinutes = URL_EXPIRY_MINUTES)
        {
            var newFileName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = GetFolderPath(folder) + newFileName,
                Verb = HttpVerb.PUT,
                ContentType = contentType,
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes)
            };

            return (_s3Client.GetPreSignedURL(request), newFileName);
        }

        public async Task<string> ReplaceFileAsync(Stream fileStream, string fileName, string contentType, WasabiImageFolder folder)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var folderPath = GetFolderPath(folder);
                var key = folderPath + fileName;

                // Check if file exists first (optional but recommended)
                var fileExists = await DoesFileExistAsync(fileName, folder);
                if (!fileExists)
                {
                    Console.WriteLine($"[WARNING] File '{key}' does not exist. Creating new file instead.");
                }

                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = memoryStream,
                    ContentType = contentType,
                    AutoResetStreamPosition = true,
                    AutoCloseStream = true,
                    DisablePayloadSigning = true,
                    CannedACL = S3CannedACL.Private
                };

                putRequest.ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256;

                await _s3Client.PutObjectAsync(putRequest);

                Console.WriteLine($"[SUCCESS] File replaced successfully: {key}");
                return GetFileUrl(fileName, folder);
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"[ERROR] Error replacing file in Wasabi: {ex.Message}");
                throw new Exception($"Error replacing file in Wasabi: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Unexpected error replacing file: {ex.Message}");
                throw;
            }
        }
    }
}


