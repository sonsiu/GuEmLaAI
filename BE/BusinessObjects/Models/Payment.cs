using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Payment
{
    public int Id { get; set; }

    public long OrderCode { get; set; }

    public int Amount { get; set; }

    public string Description { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? PaymentUrl { get; set; }

    public string? CheckoutUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? TransactionId { get; set; }

    public int? UserId { get; set; }

    public virtual ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();

    public virtual User? User { get; set; }
}
