using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemWearHistory
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public int UserId { get; set; }

    public int? OutfitId { get; set; }

    public DateOnly WornDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Item Item { get; set; } = null!;

    public virtual Outfit? Outfit { get; set; }

    public virtual User User { get; set; } = null!;
}
