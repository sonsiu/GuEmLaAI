using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ItemSeason
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public string SeasonName { get; set; } = null!;

    public virtual Item Item { get; set; } = null!;
}
