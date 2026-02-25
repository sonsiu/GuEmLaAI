using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.BusinessObjects.RequestModels.Payment;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Net.payOS;
using Net.payOS.Types;

namespace GuEmLaAI.Services
{
    public class PaymentService
    {
        private readonly PayOS _payOS;
        private readonly GuEmLaAiContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IServiceProvider _serviceProvider;
        private readonly CreditService _creditService;
        private readonly NotificationService _notificationService;

        public PaymentService(
            IConfiguration configuration,
            GuEmLaAiContext context,
            IHttpContextAccessor httpContextAccessor,
            IServiceProvider serviceProvider,
            CreditService creditService,
            NotificationService notificationService)
        {
            _configuration = configuration;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _serviceProvider = serviceProvider;
            _creditService = creditService;
            _notificationService = notificationService;

            var clientId = _configuration["PayOS:ClientId"];
            var apiKey = _configuration["PayOS:ApiKey"];
            var checksumKey = _configuration["PayOS:ChecksumKey"];
            _payOS = new PayOS(clientId!, apiKey!, checksumKey!);
        }

        public async Task<CreatePaymentResult> CreatePaymentLinkAsync(PaymentRequest request, int userId)
        {
            try
            {
                var orderCode = long.Parse(DateTimeOffset.Now.ToString("ffffff"));

                var items = request.Items.Select(item =>
                    new ItemData(item.Name, item.Quantity, item.Price)).ToList();

                int expirationDuration = 10;
                var expirationTime = DateTimeOffset.Now.AddMinutes(expirationDuration).ToUnixTimeSeconds();

                var baseUrl = _configuration["AppSettings:VerifyBaseUrl"];
                var returnUrl = request.ReturnUrl ?? $"{baseUrl}/credit-packs?payment=success&orderCode={orderCode}";
                var cancelUrl = request.CancelUrl ?? $"{baseUrl}/credit-packs?payment=cancelled&orderCode={orderCode}";

                var paymentLinkRequest = new PaymentData(
                    orderCode: orderCode,
                    amount: request.Amount,
                    description: request.Description,
                    items: items,
                    returnUrl: returnUrl,
                    cancelUrl: cancelUrl,
                    expiredAt: (int)expirationTime
                );

                var response = await _payOS.createPaymentLink(paymentLinkRequest);

                var payment = new Payment
                {
                    OrderCode = orderCode,
                    Amount = request.Amount,
                    Description = request.Description,
                    Status = "PENDING",
                    PaymentUrl = response.paymentLinkId,
                    CheckoutUrl = response.checkoutUrl,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[PAYMENT] Created - OrderCode: {orderCode}, CheckoutUrl: {response.checkoutUrl}");
                Console.WriteLine(response);

                // Schedule automatic expiration check after 10 minutes
                // Fire-and-forget: Check if payment is still PENDING after expiration time
                _ = Task.Run(async () =>
                {
                    await Task.Delay(TimeSpan.FromMinutes(expirationDuration));
                    await CheckAndExpireSinglePaymentAsync(orderCode);
                });

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating payment link: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<List<Payment>> GetPaymentsAsync(int userId, string? status = null)
        {
            try
            {
                var query = _context.Payments.AsQueryable();

                query = query.Where(p => p.UserId == userId);
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(p => p.Status == status);
                }

                return await query
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving payment records: {ex.Message}");
                throw;
            }
        }

        public async Task<Payment?> GetPaymentInfoFromDbAsync(long orderCode)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

            return payment;
        }

        public async Task<bool> UpdatePaymentInfoAsync(long orderCode, string status)
        {
            try
            {
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

                if (payment != null)
                {
                    payment.Status = status;
                    if (payment.PaidAt == null && status == "PAID")
                    {
                        payment.PaidAt = DateTime.UtcNow;

                        if (payment.UserId.HasValue)
                        {
                            var creditsToAward = _creditService.CalculateCreditsFromPayment(payment.Amount);

                            await _creditService.AddCreditsAsync(
                                payment.UserId.Value,
                                creditsToAward,
                                $"Credit purchase from payment #{orderCode}",
                                payment.Id,
                                $"PAYMENT_{orderCode}"
                            );

                            await _notificationService.SendPaymentNotificationAsync(
                                payment.UserId.Value,
                                payment.Amount,
                                true
                            );
                        }
                    }
                    else if (status == "FAILED" || status == "CANCELLED" || status == "EXPIRED")
                    {
                        if (payment.UserId.HasValue)
                        {
                            await _notificationService.SendPaymentNotificationAsync(
                                payment.UserId.Value,
                                payment.Amount,
                                false
                            );
                        }
                    }

                    await _context.SaveChangesAsync();
                }
                return true;

            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<Payment?> GetPaymentInfoFromDBAsync(long orderCode)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderCode == orderCode);
        }

        public async Task<PaymentLinkInformation> GetPaymentInfoFromSourceAsync(long orderCode)
        {
            return await _payOS.getPaymentLinkInformation(orderCode);
        }

        public async Task<PaymentLinkInformation> CancelPaymentAsync(long orderCode, string? cancellationReason = null)
        {
            var result = await _payOS.cancelPaymentLink(orderCode, cancellationReason);

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

            if (payment != null)
            {
                payment.Status = "CANCELLED";
                await _context.SaveChangesAsync();
            }

            return result;
        }

        public async Task<bool> ProcessWebhookAsync(WebhookType webhookBody, string signature)
        {
            try
            {
                Console.WriteLine($"[WEBHOOK] Processing webhook for order {webhookBody.data.orderCode}");

                var webhookData = _payOS.verifyPaymentWebhookData(webhookBody);

                if (webhookData != null)
                {
                    Console.WriteLine($"[WEBHOOK] Webhook verified - OrderCode: {webhookData.orderCode}, Code: {webhookData.code}, Description: {webhookData.desc}");

                    // The webhook doesn't fire cancel/expired events for some fucking reason
                    string newStatus = webhookData.code switch
                    {
                        "00" => "PAID",           // Payment successful
                        _ => "FAILED"             // Unknown status, mark as failed
                    };

                    Console.WriteLine($"[WEBHOOK] Mapping code '{webhookData.code}' to status '{newStatus}'");

                    var success = await UpdatePaymentInfoAsync(webhookData.orderCode, newStatus);

                    if (success)
                    {
                        Console.WriteLine($"[WEBHOOK] Payment {webhookData.orderCode} updated to status: {newStatus}");
                        return true;
                    }
                    else
                    {
                        Console.WriteLine($"[WEBHOOK] Failed to update payment {webhookData.orderCode}");
                    }
                }
                else
                {
                    Console.WriteLine("[WEBHOOK] Webhook verification failed - invalid signature");
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WEBHOOK ERROR] {ex.Message}");
                Console.WriteLine($"[WEBHOOK ERROR] Stack: {ex.StackTrace}");
                return false;
            }
        }

        private async Task CheckAndExpireSinglePaymentAsync(long orderCode)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GuEmLaAiContext>();
                var creditService = scope.ServiceProvider.GetRequiredService<CreditService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                var payment = await context.Payments
                    .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

                if (payment == null)
                {
                    Console.WriteLine($"[EXPIRATION] Payment {orderCode} not found");
                    return;
                }

                if (payment.Status != "PENDING")
                {
                    Console.WriteLine($"[EXPIRATION] Payment {orderCode} already processed with status: {payment.Status}");
                    return;
                }

                Console.WriteLine($"[EXPIRATION] Checking expired payment {orderCode}");

                try
                {
                    var payosInfo = await _payOS.getPaymentLinkInformation(orderCode);

                    if (payosInfo.status == "CANCELLED" || payosInfo.status == "EXPIRED")
                    {
                        Console.WriteLine($"[EXPIRATION] Payment {orderCode} confirmed as {payosInfo.status} by PayOS");
                        payment.Status = payosInfo.status;

                        if (payment.UserId.HasValue)
                        {
                            await notificationService.SendPaymentNotificationAsync(
                                payment.UserId.Value,
                                payment.Amount,
                                false
                            );
                        }

                        await context.SaveChangesAsync();
                    }
                    else if (payosInfo.status == "PAID")
                    {
                        Console.WriteLine($"[EXPIRATION] Payment {orderCode} was actually PAID - webhook may have failed!");
                        payment.Status = "PAID";
                        payment.PaidAt = DateTime.UtcNow;

                        if (payment.UserId.HasValue)
                        {
                            var creditsToAward = creditService.CalculateCreditsFromPayment(payment.Amount);
                            await creditService.AddCreditsAsync(
                                payment.UserId.Value,
                                creditsToAward,
                                $"Credit purchase from payment #{orderCode}",
                                payment.Id,
                                $"PAYMENT_{orderCode}"
                            );

                            await notificationService.SendPaymentNotificationAsync(
                                payment.UserId.Value,
                                payment.Amount,
                                true
                            );
                        }

                        await context.SaveChangesAsync();
                    }
                    else
                    {
                        Console.WriteLine($"[EXPIRATION] Payment {orderCode} has unexpected status: {payosInfo.status}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EXPIRATION] PayOS API error for {orderCode}: {ex.Message}");
                    payment.Status = "EXPIRED";

                    if (payment.UserId.HasValue)
                    {
                        await notificationService.SendPaymentNotificationAsync(
                            payment.UserId.Value,
                            payment.Amount,
                            false
                        );
                    }

                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EXPIRATION ERROR] Failed to check payment {orderCode}: {ex.Message}");
            }
        }

        public async Task CheckAndExpireOldPaymentsAsync()
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddMinutes(-10);
                var pendingPayments = await _context.Payments
                    .Where(p => p.Status == "PENDING" && p.CreatedAt < cutoffTime)
                    .ToListAsync();

                Console.WriteLine($"[EXPIRATION BULK] Found {pendingPayments.Count} pending payments older than 10 minutes");

                foreach (var payment in pendingPayments)
                {
                    await CheckAndExpireSinglePaymentAsync(payment.OrderCode);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EXPIRATION BULK ERROR] {ex.Message}");
            }
        }
    }
}