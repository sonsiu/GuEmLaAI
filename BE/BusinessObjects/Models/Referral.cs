using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Referral
{
    public int Id { get; set; }

    public int ReferrerId { get; set; }

    public int RefereeId { get; set; }

    public DateTime? Date { get; set; }

    public virtual User Referee { get; set; } = null!;

    public virtual User Referrer { get; set; } = null!;
}
