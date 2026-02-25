using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ImageGenerated
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Image { get; set; }

    public DateTime? Created { get; set; }

    public virtual User User { get; set; } = null!;
}
