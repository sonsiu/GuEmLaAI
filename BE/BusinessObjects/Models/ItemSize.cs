using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemSize
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public string SizeName { get; set; } = null!;

    public virtual Item Item { get; set; } = null!;
}
