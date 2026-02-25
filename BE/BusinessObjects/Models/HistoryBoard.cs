using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class HistoryBoard
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Image { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiredAt { get; set; }

    public string? ItemJsonTemplate { get; set; }

    public virtual User User { get; set; } = null!;
}
