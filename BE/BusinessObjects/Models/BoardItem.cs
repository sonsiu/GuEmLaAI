using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class BoardItem
{
    public int Id { get; set; }

    public int BoardId { get; set; }

    public int ItemId { get; set; }

    public string ItemPreview { get; set; } = null!;

    public int Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Board Board { get; set; } = null!;
}
