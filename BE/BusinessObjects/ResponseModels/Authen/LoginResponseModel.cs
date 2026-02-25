using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessObjects.ResponseModels.Authen
{
    public class LoginResponseModel
    {
        public string AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public string DisplayName { get; set; }
        public int Id { get; set; }
        public int Role { get; set; }

        public string ReferralCode { get; set; }
        public string ReferralStatus { get; set; }
        public int ReferredById { get; set; }
        public int ItemUploadCount { get; set; }
        public int OutfitUploadCount { get; set; }
        public int VirtualTryOnUsedCount { get; set; }
    }
}
