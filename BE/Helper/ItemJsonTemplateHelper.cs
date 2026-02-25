using GuEmLaAI.BusinessObjects.ResponseModels.Board;
using GuEmLaAI.Services;
using System.Text.Json;

namespace GuEmLaAI.Helper
{
    public static class ItemJsonTemplateHelper
    {
        /// <param name="jsonTemplate">The JSON template string to deserialize</param>
        /// <param name="wasabiService">The Wasabi S3 service for generating presigned URLs</param>
        /// <param name="urlExpiryMinutes">URL expiry time in minutes (default: 60)</param>
        /// <returns>List of HistoryBoardItemTemplateDto with presigned URLs</returns>
        public static List<HistoryBoardItemTemplateDto> DeserializeItemTemplate(
            string? jsonTemplate, 
            WasabiS3Service wasabiService, 
            int urlExpiryMinutes = 60)
        {
            var items = new List<HistoryBoardItemTemplateDto>();

            if (string.IsNullOrEmpty(jsonTemplate))
                return items;

            try
            {
                var jsonElements = JsonSerializer.Deserialize<List<JsonElement>>(jsonTemplate);
                if (jsonElements == null)
                    return items;

                foreach (var element in jsonElements)
                {
                    var imagePreview = element.TryGetProperty("image_preview", out var imageProp) 
                        ? imageProp.GetString() ?? "" 
                        : "";
                    
                    var dto = new HistoryBoardItemTemplateDto
                    {
                        Id = element.TryGetProperty("id", out var idProp) ? idProp.GetInt32() : 0,
                        ImagePreview = imagePreview,
                        ImageUrl = !string.IsNullOrEmpty(imagePreview) 
                            ? wasabiService.GetPreSignedUrl(imagePreview, WasabiImageFolder.items, urlExpiryMinutes)
                            : null,
                        Name = element.TryGetProperty("comment", out var commentProp) 
                            ? commentProp.GetString()
                            : null,
                        CategoryCode = element.TryGetProperty("category_code", out var catProp) 
                            ? catProp.GetString()
                            : null
                    };
                    
                    items.Add(dto);
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error deserializing ItemJsonTemplate: {ex.Message}");
            }

            return items;
        }
    }
}
