using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;

namespace GuEmLaAI.Helper
{
    public class ImageConverter
    {
        public static async Task<MemoryStream> ConvertToWebP(Stream inputStream, int quality = 60)
        {
            var outputStream = new MemoryStream();
            
            using (var image = await Image.LoadAsync(inputStream))
            {
                // Configure WebP encoder
                var webpEncoder = new WebpEncoder
                {
                    Quality = quality, // Adjustable quality (0-100)
                    FileFormat = WebpFileFormatType.Lossy
                };

                // Save as WebP
                await image.SaveAsWebpAsync(outputStream, webpEncoder);
            }

            // Reset stream position
            outputStream.Position = 0;
            return outputStream;
        }
    }
}
