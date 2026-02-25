using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GuEmLaAI.Services;
using GuEmLaAI.BusinessObjects.RequestModels.Payment;
using Net.payOS.Types;
using System.Text;
using GuEmLaAI.BusinessObjects.Models;

namespace GuEmLaAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _payOSService;

        public PaymentController(PaymentService payOSService)
        {
            _payOSService = payOSService;
        }

        [HttpPost("create-embedded-payment-link")]
        public async Task<IActionResult> CreateEmbeddedPaymentLink([FromBody] PaymentRequest request, [FromQuery] int userId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid request data" });
            }

            try
            {
                var result = await _payOSService.CreatePaymentLinkAsync(request, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PAYMENT ERROR] Error creating payment link: {ex.Message}");
                return BadRequest(new { message = $"Error creating payment link: {ex.Message}" });
            }
        }

        // Get payment info from DATABASE (for efficient polling)
        [HttpGet("info")]
        public async Task<ActionResult<Payment>> GetPaymentInfo([FromQuery] long orderCode)
        {
            try
            {
                var result = await _payOSService.GetPaymentInfoFromDBAsync(orderCode);
                if (result == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = $"Error getting payment info: {ex.Message}" });
            }
        }

        [HttpGet("source-info")]
        public async Task<ActionResult<PaymentLinkInformation>> GetPaymentInfoFromSource([FromQuery] long orderCode)
        {
            try
            {
                var result = await _payOSService.GetPaymentInfoFromSourceAsync(orderCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = $"Error getting payment info: {ex.Message}" });
            }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentWebhook()
        {
            try
            {
                Console.WriteLine("[WEBHOOK] Received payment webhook");
                
                using var reader = new StreamReader(Request.Body, Encoding.UTF8);
                string webhookBodyString = await reader.ReadToEndAsync();
                
                Console.WriteLine($"[WEBHOOK] Body: {webhookBodyString}");
                
                WebhookType webhookBody = System.Text.Json.JsonSerializer.Deserialize<WebhookType>(webhookBodyString)!;

                var signature = Request.Headers["X-PayOS-Signature"].FirstOrDefault();
                Console.WriteLine($"[WEBHOOK] Signature: {signature}");
                
                var isValid = await _payOSService.ProcessWebhookAsync(webhookBody, signature ?? "");
                
                if (isValid)
                {
                    Console.WriteLine("[WEBHOOK] Webhook processed successfully");
                    return Ok(new { success = true });
                }
                else
                {
                    Console.WriteLine("[WEBHOOK] Invalid webhook signature or data");
                    return BadRequest(new { message = "Invalid webhook" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WEBHOOK ERROR] {ex.Message}");
                Console.WriteLine($"[WEBHOOK ERROR] Stack: {ex.StackTrace}");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("return")]
        [AllowAnonymous]
        public IActionResult PaymentReturn(
            [FromQuery] string code,
            [FromQuery] long orderCode,
            [FromQuery] string? status = null)
        {
            string paymentResult = code == "00" ? "success" : "failed";
            
            return Content($@"
                <!DOCTYPE html>
                <html>
                <head><title>Payment {(code == "00" ? "Successful" : "Failed")}</title></head>
                <body>
                    <script>
                        if (window.parent !== window) {{
                            window.parent.postMessage({{
                                type: 'PAYMENT_{(code == "00" ? "SUCCESS" : "FAILED")}',
                                code: '{code}',
                                orderCode: {orderCode},
                                status: '{status}'
                            }}, '*');
                        }} else {{
                            window.location.href = '/payment?payment={paymentResult}&code={code}&orderCode={orderCode}';
                        }}
                    </script>
                    <p>Payment {(code == "00" ? "successful" : "failed")}. Redirecting...</p>
                </body>
                </html>
            ", "text/html");
        }

        [HttpGet("cancel")]
        [AllowAnonymous]
        public IActionResult PaymentCancel([FromQuery] long orderCode)
        {
            return Content($@"
                <!DOCTYPE html>
                <html>
                <head><title>Payment Cancelled</title></head>
                <body>
                    <script>
                        if (window.parent !== window) {{
                            window.parent.postMessage({{
                                type: 'PAYMENT_CANCELLED',
                                orderCode: {orderCode}
                            }}, '*');
                        }} else {{
                            window.location.href = '/payment?payment=cancelled&orderCode={orderCode}';
                        }}
                    </script>
                    <p>Payment cancelled. Redirecting...</p>
                </body>
                </html>
            ", "text/html");
        }

        [HttpGet("list")]
        public async Task<ActionResult<List<Payment>>> GetPayments(
            [FromQuery] int userId, 
            [FromQuery] string? status = null)
        {
            try
            {
                var payments = await _payOSService.GetPaymentsAsync(userId, status);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PAYMENT ERROR] Error retrieving payments: {ex.Message}");
                return BadRequest(new { message = $"Error retrieving payments: {ex.Message}" });
            }
        }
    }
}