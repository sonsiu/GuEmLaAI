using System.Net;
using System.Net.Mail;

namespace GuEmLaAI.Extensions {
    public static class FluentEmailExtensions {
        public static void AddFluentEmailServices(this IServiceCollection services, ConfigurationManager configuration) {
            var emailSetting = configuration.GetSection("EmailSettings");

            var defaultFromEmail = emailSetting.GetValue<string>("DefaultFromEmail");
            var host = emailSetting.GetValue<string>("Host");
            var port = emailSetting.GetValue<int>("Port");
            var userName = emailSetting.GetValue<string>("UserName");
            var password = emailSetting.GetValue<string>("Password");

            var smtpClient = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(userName, password),
                EnableSsl = true,          
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            services.AddFluentEmail(defaultFromEmail)
                .AddSmtpSender(smtpClient)
                .AddRazorRenderer();
        }
    }
}
