using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace GuEmLaAI.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ReplicateController : Controller {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public ReplicateController(IHttpClientFactory httpClientFactory, IConfiguration configuration) {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] VellaRequest request) {
            if (string.IsNullOrWhiteSpace(request.ModelImage))
                return BadRequest("model_image is required.");

            if (request.TopImage == null && request.BottomImage == null &&
                request.OuterImage == null && request.DressImage == null)
                return BadRequest("At least one garment image (top, bottom, outer, dress) is required.");

            var apiToken = _configuration["Replicate:ApiToken"];
            if (string.IsNullOrWhiteSpace(apiToken))
                return StatusCode(500, "Replicate API token not configured.");

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", apiToken);

            // Dynamically build input dictionary and remove nulls
            var input = new Dictionary<string, object?>
            {
                ["model_image"] = request.ModelImage,
                ["top_image"] = request.TopImage,
                ["bottom_image"] = request.BottomImage,
                ["outer_image"] = request.OuterImage,
                ["dress_image"] = request.DressImage,
                ["top_mask_image"] = request.TopMaskImage,
                ["bottom_mask_image"] = request.BottomMaskImage,
                ["outer_mask_image"] = request.OuterMaskImage,
                ["dress_mask_image"] = request.DressMaskImage,
                ["seed"] = request.Seed,
                ["num_outputs"] = request.NumOutputs,
                ["output_format"] = request.OutputFormat
            };

            // Filter out nulls
            var filteredInput = input
                .Where(kv => kv.Value != null)
                .ToDictionary(kv => kv.Key, kv => kv.Value);

            // Build request body with filtered input only
            var body = new
            {
                version = "796c44062becb12f27689cafd4189df75be6189a930c5a6d314f91ae5853f7eb",
                input = filteredInput
            };

            // Ensure null values are ignored during serialization
            var json = JsonSerializer.Serialize(body, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // POST to Replicate
            var startResponse = await client.PostAsync("https://api.replicate.com/v1/predictions", content);
            var startJson = await startResponse.Content.ReadAsStringAsync();

            if (!startResponse.IsSuccessStatusCode)
                return StatusCode((int)startResponse.StatusCode, startJson);

            using var startDoc = JsonDocument.Parse(startJson);
            var predictionUrl = startDoc.RootElement
                .GetProperty("urls")
                .GetProperty("get")
                .GetString();

            if (string.IsNullOrWhiteSpace(predictionUrl))
                return StatusCode(500, "Could not retrieve prediction status URL.");

            string status = startDoc.RootElement.GetProperty("status").GetString() ?? "unknown";
            JsonDocument? finalDoc = null;

            // Poll until finished
            for (int i = 0; i < 30 && status != "succeeded" && status != "failed"; i++) {
                await Task.Delay(2000);
                var pollResponse = await client.GetAsync(predictionUrl);
                var pollJson = await pollResponse.Content.ReadAsStringAsync();
                finalDoc = JsonDocument.Parse(pollJson);
                status = finalDoc.RootElement.GetProperty("status").GetString() ?? "unknown";
            }

            if (status != "succeeded")
                return StatusCode(500, $"Prediction did not succeed. Final status: {status}");

            // Extract output URLs
            var outputProp = finalDoc!.RootElement.GetProperty("output");
            if (outputProp.ValueKind != JsonValueKind.Array)
                return StatusCode(500, "Output is not an array or still null.");

            var items = outputProp
                .EnumerateArray()
                .Select(x => x.GetString() ?? string.Empty)
                .Where(x => !string.IsNullOrEmpty(x))
                .ToList();

            return Ok(new VellaResponse { Items = items });
        }
    }

    public class VellaRequest {
        public string ModelImage { get; set; } = null!;
        public string? TopImage { get; set; }
        public string? BottomImage { get; set; }
        public string? OuterImage { get; set; }
        public string? DressImage { get; set; }
        public string? TopMaskImage { get; set; }
        public string? BottomMaskImage { get; set; }
        public string? OuterMaskImage { get; set; }
        public string? DressMaskImage { get; set; }
        public int? Seed { get; set; }
        public int? NumOutputs { get; set; }
        public string? OutputFormat { get; set; }
    }

    public class VellaResponse {
        public IList<string> Items { get; set; } = new List<string>();
    }
}
