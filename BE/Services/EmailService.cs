using System.Net;
using System.Net.Mail;
using FluentEmail.Core;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.Services {
    public class EmailService {
        private readonly IFluentEmailFactory _fluentEmailFactory;
        
        public EmailService(IFluentEmailFactory fluentEmailFactory) {
            _fluentEmailFactory = fluentEmailFactory;
        }
        
        public async Task Send(EmailMetaData emailMetaData) {
            var email = _fluentEmailFactory.Create();
            await email.To(emailMetaData.ToAddress)
                .Subject(emailMetaData.Subject)
                .Body(emailMetaData.Body)
                .SendAsync();
        }
        
        public async Task SendUsingTemplate(EmailMetaData emailMetaData, User user, string templateFile) {
            var email = _fluentEmailFactory.Create();
            await email.To(emailMetaData.ToAddress)
                .Subject(emailMetaData.Subject)
                .UsingTemplateFromFile(templateFile, user)
                .SendAsync();
        }
        
        public async Task SendEmailVerificationAsync(
            EmailMetaData emailMetaData, 
            User user, 
            string templateFile, 
            string verificationLink) 
        {
            var templateModel = new
            {
                DisplayName = user.DisplayName ?? user.Email,
                Email = user.Email,
                VerificationUrl = verificationLink
            };

            var email = _fluentEmailFactory.Create();
            await email
                .To(emailMetaData.ToAddress)
                .Subject(emailMetaData.Subject)
                .UsingTemplateFromFile(templateFile, templateModel)
                .SendAsync();
        }

        public async Task SendCalendarReminderAsync(
            EmailMetaData emailMetaData,
            string displayName,
            string email,
            int itemCount,
            int outfitCount,
            int eventCount,
            string templateFile,
            string todayDate,
            string currentYear,
            string? calendarUrl = null)
        {
            var templateModel = new
            {
                DisplayName = displayName ?? email,
                Email = email,
                ItemCount = itemCount,
                OutfitCount = outfitCount,
                EventCount = eventCount,
                CalendarUrl = calendarUrl ?? "#",
                TodayDate = todayDate,
                CurrentYear = currentYear
            };

            var fluentEmail = _fluentEmailFactory.Create();
            await fluentEmail
                .To(emailMetaData.ToAddress)
                .Subject(emailMetaData.Subject)
                .UsingTemplateFromFile(templateFile, templateModel)
                .SendAsync();
        }
    }
}
