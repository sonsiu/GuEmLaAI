using GuEmLaAI.BusinessObjects.Enums;

namespace GuEmLaAI.BusinessObjects.ResponseModels.Authen {
    public class EmailVerifyResponse {
        public EmailVerifyStatus Status { get; }
        public string Message { get; }

        public EmailVerifyResponse(EmailVerifyStatus status, string message) {
            Status = status;
            Message = message;
        }
    }
}
