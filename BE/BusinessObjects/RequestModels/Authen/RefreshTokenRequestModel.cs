using System.ComponentModel.DataAnnotations;

namespace BusinessObjects.RequestModels.Authen
{
    public class RefreshTokenRequestModel
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
