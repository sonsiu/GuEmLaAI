using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace GuEmLaAI.Helper
{
    public class FashnHelper
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _runUrl;     
        private readonly string _statusUrl;  

        public FashnHelper(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["Fashn:ApiKey"]
                ?? throw new ArgumentNullException("Fashn:ApiKey not configured");
            _runUrl = config["Fashn:ApiRunUrl"]  
                ?? throw new ArgumentNullException("Fashn:ApiRunUrl not configured");
            _statusUrl = config["Fashn:ApiStatusUrl"] 
                ?? throw new ArgumentNullException("Fashn:ApiStatusUrl not configured");
        }

        public async Task<string> TryOnSingleAsync(string modelImageBase64, string garmentImageBase64, string modeType)
        {
            // 1. HAVE FUN
            var reqObj = new
            {
                model_name = "tryon-v1.6",
                inputs = new
                {
                    model_image = modelImageBase64,
                    garment_image = garmentImageBase64,
                    mode = modeType
                }
            };
            var jsonPayload = JsonSerializer.Serialize(reqObj);

            using var postRequest = new HttpRequestMessage(HttpMethod.Post, _runUrl);
            postRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            postRequest.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            using var postResp = await _httpClient.SendAsync(postRequest);
            var postText = await postResp.Content.ReadAsStringAsync();
            if (!postResp.IsSuccessStatusCode)
            {
                throw new Exception($"FASHN API POST error: {postResp.StatusCode}\n{postText}");
            }

            using var postDoc = JsonDocument.Parse(postText);
            var root = postDoc.RootElement;

            if (!root.TryGetProperty("id", out var idProp))
                throw new Exception($"FASHN post returned no id. Response: {postText}");

            string jobId = idProp.GetString() ?? throw new Exception("Job id was null");

            // 2. Poll status until completion or failure
            const int maxRetries = 30;
            const int delayMs = 1000;

            for (int i = 0; i < maxRetries; i++)
            {
                await Task.Delay(delayMs);

                string pollUrl = $"{_statusUrl}/{jobId}";
                using var getRequest = new HttpRequestMessage(HttpMethod.Get, pollUrl);
                getRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

                using var getResp = await _httpClient.SendAsync(getRequest);
                var getText = await getResp.Content.ReadAsStringAsync();
                if (!getResp.IsSuccessStatusCode)
                {
                    throw new Exception($"FASHN polling error (status): {getResp.StatusCode}\n{getText}");
                }

                using var pollDoc = JsonDocument.Parse(getText);
                var pollRoot = pollDoc.RootElement;

                // get status
                if (!pollRoot.TryGetProperty("status", out var statusProp))
                {
                    throw new Exception($"FASHN polling response has no status. Response: {getText}");
                }
                string status = statusProp.GetString();

                if (status == "completed")
                {
                    // output should exist
                    if (pollRoot.TryGetProperty("output", out var outputElem) &&
                        outputElem.ValueKind == JsonValueKind.Array &&
                        outputElem.GetArrayLength() > 0)
                    {
                        string firstUrl = outputElem[0].GetString();
                        if (!string.IsNullOrEmpty(firstUrl))
                            return firstUrl;
                    }
                    // No valid output found
                    throw new Exception($"FASHN completed but no output. Poll response: {getText}");
                }
                else if (status == "failed")
                {
                    // read error
                    string errMsg = null;
                    if (pollRoot.TryGetProperty("error", out var errElem))
                        errMsg = errElem.ToString();
                    throw new Exception($"FASHN job {jobId} failed. Error: {errMsg}. Poll response: {getText}");
                }

                // else status is one of "starting", "in_queue", "processing" → just continue polling
            }

            throw new Exception($"FASHN job {jobId} did not complete within expected time.");
        }

        /// <summary>
        /// Downloads the generated image from the Fashn API URL
        /// </summary>
        public async Task<Stream> DownloadGeneratedImageAsync(string imageUrl)
        {
            var response = await _httpClient.GetAsync(imageUrl);
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to download image from Fashn API: {response.StatusCode}");
            }

            // Create a memory stream that we can rewind
            var memoryStream = new MemoryStream();
            await response.Content.CopyToAsync(memoryStream);
            memoryStream.Position = 0; // Rewind the stream for reading

            return memoryStream;
        }
    }
}
