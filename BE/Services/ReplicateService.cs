using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace GuEmLaAI.Services
{
    /// <summary>
    /// Service for interacting with Replicate API for background removal
    /// </summary>
    public class ReplicateService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string API_BASE = "https://api.replicate.com/v1";
        private const string REMOVE_BG_MODEL = "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1";

        public ReplicateService(IConfiguration configuration, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Replicate:ApiKey"] 
                ?? throw new InvalidOperationException("Replicate API key not configured");
        }

        /// <summary>
        /// Submits an image to Replicate for background removal
        /// </summary>
        /// <param name="imageUrl">URL of the image to process</param>
        /// <returns>Prediction object containing prediction ID and status URL</returns>
        public async Task<ReplicatePredictionResponse> RemoveBackgroundAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                throw new ArgumentException("Image URL cannot be empty", nameof(imageUrl));

            try
            {
                var request = new ReplicatePredictionRequest
                {
                    Version = REMOVE_BG_MODEL,
                    Input = new ReplicateInput
                    {
                        Image = imageUrl
                    }
                    // Webhook and WebhookEventsFilter are deliberately not set (null)
                };

                // Configure serializer to ignore null values
                var jsonOptions = new JsonSerializerOptions
                {
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(request, jsonOptions),
                    System.Text.Encoding.UTF8,
                    "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{API_BASE}/predictions")
                {
                    Content = jsonContent
                };

                httpRequest.Headers.Add("Authorization", $"Token {_apiKey}");

                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Replicate API error: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var prediction = JsonSerializer.Deserialize<ReplicatePredictionResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return prediction ?? throw new Exception("Failed to deserialize prediction response");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error removing background: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Polls the status of a background removal prediction
        /// </summary>
        /// <param name="predictionId">The prediction ID returned from RemoveBackgroundAsync</param>
        /// <returns>Updated prediction status</returns>
        public async Task<ReplicatePredictionResponse> GetPredictionStatusAsync(string predictionId)
        {
            if (string.IsNullOrEmpty(predictionId))
                throw new ArgumentException("Prediction ID cannot be empty", nameof(predictionId));

            try
            {
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{API_BASE}/predictions/{predictionId}");
                httpRequest.Headers.Add("Authorization", $"Token {_apiKey}");

                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Replicate API error: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var prediction = JsonSerializer.Deserialize<ReplicatePredictionResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return prediction ?? throw new Exception("Failed to deserialize prediction response");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error getting prediction status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Polls prediction status until completion or timeout
        /// </summary>
        /// <param name="predictionId">The prediction ID</param>
        /// <param name="maxWaitSeconds">Maximum time to wait (default 300s = 5 minutes)</param>
        /// <param name="pollIntervalMs">Interval between polls in milliseconds (default 1000ms = 1 second)</param>
        /// <returns>Completed prediction with output URL</returns>
        public async Task<ReplicatePredictionResponse> WaitForCompletionAsync(
            string predictionId, 
            int maxWaitSeconds = 300, 
            int pollIntervalMs = 1000)
        {
            var startTime = DateTime.UtcNow;
            var maxWait = TimeSpan.FromSeconds(maxWaitSeconds);

            while (DateTime.UtcNow - startTime < maxWait)
            {
                var prediction = await GetPredictionStatusAsync(predictionId);

                // Status is: "starting", "processing", "succeeded", "failed", or "canceled"
                if (prediction.Status == "succeeded" || prediction.Status == "failed" || prediction.Status == "canceled")
                {
                    return prediction;
                }

                // Wait before polling again
                await Task.Delay(pollIntervalMs);
            }

            throw new TimeoutException($"Prediction {predictionId} did not complete within {maxWaitSeconds} seconds");
        }

        /// <summary>
        /// Combines RemoveBackgroundAsync and WaitForCompletionAsync for convenience
        /// </summary>
        /// <param name="imageUrl">URL of the image to process</param>
        /// <param name="maxWaitSeconds">Maximum time to wait for completion</param>
        /// <returns>Processed image URL (output)</returns>
        public async Task<string> RemoveBackgroundAndWaitAsync(string imageUrl, int maxWaitSeconds = 300)
        {
            var prediction = await RemoveBackgroundAsync(imageUrl);
            var completed = await WaitForCompletionAsync(prediction.Id, maxWaitSeconds);

            if (completed.Status == "failed")
            {
                throw new Exception($"Background removal failed: {completed.Error}");
            }

            if (completed.Status == "canceled")
            {
                throw new Exception("Background removal was canceled");
            }

            if (completed.Output == null)
            {
                throw new Exception("No output image URL returned from Replicate");
            }

            // Output is typically an array with the first element being the image URL
            if (completed.Output is JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == JsonValueKind.Array && jsonElement.GetArrayLength() > 0)
                {
                    return jsonElement[0].GetString() ?? throw new Exception("Failed to extract image URL from output");
                }
            }

            return completed.Output?.ToString() ?? throw new Exception("Invalid output format");
        }
    }

    /// <summary>
    /// Request model for Replicate API prediction
    /// </summary>
    public class ReplicatePredictionRequest
    {
        [JsonPropertyName("version")]
        public string? Version { get; set; }

        [JsonPropertyName("input")]
        public ReplicateInput? Input { get; set; }

        [JsonPropertyName("webhook")]
        public string? Webhook { get; set; }

        [JsonPropertyName("webhook_events_filter")]
        public string[]? WebhookEventsFilter { get; set; }
    }

    /// <summary>
    /// Input model for remove-bg model
    /// </summary>
    public class ReplicateInput
    {
        [JsonPropertyName("image")]
        public string? Image { get; set; }
    }

    /// <summary>
    /// Response model from Replicate API predictions
    /// </summary>
    public class ReplicatePredictionResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("version")]
        public string? Version { get; set; }

        [JsonPropertyName("urls")]
        public ReplicateUrls? Urls { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("started_at")]
        public DateTime? StartedAt { get; set; }

        [JsonPropertyName("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; } // starting, processing, succeeded, failed, canceled

        [JsonPropertyName("input")]
        public ReplicateInput? Input { get; set; }

        [JsonPropertyName("output")]
        public object? Output { get; set; } // Can be string URL or array of URLs

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("logs")]
        public string? Logs { get; set; }

        [JsonPropertyName("metrics")]
        public ReplicateMetrics? Metrics { get; set; }
    }

    /// <summary>
    /// URLs for prediction (get, cancel endpoints)
    /// </summary>
    public class ReplicateUrls
    {
        [JsonPropertyName("get")]
        public string? Get { get; set; }

        [JsonPropertyName("cancel")]
        public string? Cancel { get; set; }
    }

    /// <summary>
    /// Metrics for completed prediction
    /// </summary>
    public class ReplicateMetrics
    {
        [JsonPropertyName("predict_time")]
        [JsonConverter(typeof(JsonConverterFactory))]
        public int? PredictTime { get; set; }
    }

    /// <summary>
    /// Custom JSON converter to handle flexible numeric types
    /// </summary>
    public class JsonConverterFactory : JsonConverter<int?>
    {
        public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.Null:
                    return null;
                case JsonTokenType.Number:
                    if (reader.TryGetInt32(out int intValue))
                        return intValue;
                    // Try to get as double and convert to int
                    if (reader.TryGetDouble(out double doubleValue))
                        return (int)doubleValue;
                    break;
                case JsonTokenType.String:
                    // Try to parse string as int
                    if (int.TryParse(reader.GetString(), out int parsedValue))
                        return parsedValue;
                    break;
            }
            return null;
        }

        public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
                writer.WriteNumberValue(value.Value);
            else
                writer.WriteNullValue();
        }
    }
}
