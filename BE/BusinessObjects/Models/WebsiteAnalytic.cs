using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class WebsiteAnalytic
{
    public int Id { get; set; }

    public DateTime VisitDate { get; set; }

    public int? UserId { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? PageUrl { get; set; }

    public string? SessionId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
