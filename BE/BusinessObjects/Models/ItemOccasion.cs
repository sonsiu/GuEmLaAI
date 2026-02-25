using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemOccasion
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public string? OccasionName { get; set; }

    public virtual Item Item { get; set; } = null!;
}
