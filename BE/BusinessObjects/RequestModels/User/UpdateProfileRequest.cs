using System.ComponentModel.DataAnnotations;

namespace GuEmLaAI.BusinessObjects.RequestModels.User
{
    public class UpdateProfileRequest
    {
        [StringLength(100, ErrorMessage = "Display name cannot exceed 100 characters")]
        public string? DisplayName { get; set; }

        [StringLength(1000, ErrorMessage = "Bio cannot exceed 1000 characters")]
        public string? Bio { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Height must be greater than 0")]
        public double? Height { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Weight must be greater than 0")]
        public double? Weight { get; set; }

        public IFormFile? ProfileImage { get; set; }
    }
}