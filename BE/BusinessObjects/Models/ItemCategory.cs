using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemCategory
{
    public int Id { get; set; }

    public string CategoryCode { get; set; } = null!;

    public string? SoftPurpose { get; set; }

    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
