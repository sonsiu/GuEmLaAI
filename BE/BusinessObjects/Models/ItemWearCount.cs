using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemWearCount
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public int UserId { get; set; }

    public int WearCount { get; set; }

    public DateTime? LastWornDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Item Item { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
