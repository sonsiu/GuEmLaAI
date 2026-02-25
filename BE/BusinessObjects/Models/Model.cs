using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Model
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string ImageName { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
