using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class CreditTransaction
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int Amount { get; set; }

    public string Type { get; set; } = null!;

    public string Description { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public int? PaymentId { get; set; }

    public string? ReferenceId { get; set; }

    public virtual Payment? Payment { get; set; }

    public virtual User User { get; set; } = null!;
}
