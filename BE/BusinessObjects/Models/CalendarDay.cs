using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class CalendarDay
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? JsonTemplate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
