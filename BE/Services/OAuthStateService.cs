using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace GuEmLaAI.Services
{
    public class OAuthStateService
    {
        private readonly IDistributedCache _cache;
        private const int STATE_EXPIRY_MINUTES = 10;

        public OAuthStateService(IDistributedCache cache)
        {
            _cache = cache;
        }

        public class OAuthState
        {
            public string ReferralCode { get; set; }
            public string ReturnUrl { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        /// <summary>
        /// Generate a cryptographically random state and store it with OAuth context data
        /// </summary>
        public async Task<string> GenerateAndStoreStateAsync(string referralCode, string returnUrl)
        {
            var state = Guid.NewGuid().ToString("N");
            var oauthState = new OAuthState
            {
                ReferralCode = referralCode ?? "",
                ReturnUrl = returnUrl ?? "/",
                CreatedAt = DateTime.UtcNow
            };

            var cacheOptions = new DistributedCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(STATE_EXPIRY_MINUTES));

            var stateJson = JsonConvert.SerializeObject(oauthState);
            await _cache.SetStringAsync($"oauth_state_{state}", stateJson, cacheOptions);
            
            Console.WriteLine($"[DEBUG] OAuthStateService.GenerateAndStoreStateAsync - Generated state: {state}, referralCode: {referralCode}, returnUrl: {returnUrl}");
            
            return state;
        }

        /// <summary>
        /// Retrieve and validate state. Deletes state immediately after retrieval (one-time use).
        /// </summary>
        public async Task<OAuthState> GetAndValidateStateAsync(string state)
        {
            if (string.IsNullOrEmpty(state))
            {
                Console.WriteLine($"[ERROR] OAuthStateService.GetAndValidateStateAsync - State parameter is null or empty");
                throw new InvalidOperationException("State parameter is missing - CSRF protection failed.");
            }

            var key = $"oauth_state_{state}";
            var stateJson = await _cache.GetStringAsync(key);

            if (string.IsNullOrEmpty(stateJson))
            {
                Console.WriteLine($"[ERROR] OAuthStateService.GetAndValidateStateAsync - State not found in cache or expired: {state}");
                throw new InvalidOperationException("Invalid or expired state. Possible CSRF attack or session timeout.");
            }

            try
            {
                // Delete state immediately after retrieval (one-time use - prevents replay attacks)
                await _cache.RemoveAsync(key);
                
                var oauthState = JsonConvert.DeserializeObject<OAuthState>(stateJson);
                
                if (oauthState == null)
                {
                    Console.WriteLine($"[ERROR] OAuthStateService.GetAndValidateStateAsync - Failed to deserialize state JSON");
                    throw new InvalidOperationException("Failed to deserialize state data.");
                }
                
                Console.WriteLine($"[DEBUG] OAuthStateService.GetAndValidateStateAsync - State validated and deleted. referralCode: '{oauthState.ReferralCode}', returnUrl: '{oauthState.ReturnUrl}'");
                
                return oauthState;
            }
            catch (JsonSerializationException ex)
            {
                Console.WriteLine($"[ERROR] OAuthStateService.GetAndValidateStateAsync - JSON deserialization error: {ex.Message}");
                throw new InvalidOperationException("State data is corrupted.", ex);
            }
        }
    }
}
