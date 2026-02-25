using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class BoardImage
{
    public int Id { get; set; }

    public int BoardId { get; set; }

    public string? Picture { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Board Board { get; set; } = null!;

    public virtual ICollection<Board> Boards { get; set; } = new List<Board>();
}
