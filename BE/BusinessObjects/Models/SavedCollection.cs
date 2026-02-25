using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class SavedCollection
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Name { get; set; }

    public virtual User User { get; set; } = null!;
}
