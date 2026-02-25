using System.Security.Cryptography;
using GuEmLaAI.BusinessObjects.Models;
using Microsoft.AspNetCore.WebUtilities;

namespace GuEmLaAI.Helper {
    public static class TokenHelper {

        public static string GenerateSecureToken() {
            // 32 bytes -> 43 base64 chars (URL-safe)
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return WebEncoders.Base64UrlEncode(bytes);
        }
    }
}

