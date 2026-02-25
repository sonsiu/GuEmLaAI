using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Board
{
    public int Id { get; set; }

    public int OwnerId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? ImagePreview { get; set; }

    public DateTime CreatedAt { get; set; }

    public int Status { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<BoardImage> BoardImages { get; set; } = new List<BoardImage>();

    public virtual ICollection<BoardItem> BoardItems { get; set; } = new List<BoardItem>();

    public virtual ICollection<BoardOutfit> BoardOutfits { get; set; } = new List<BoardOutfit>();

    public virtual BoardImage? ImagePreviewNavigation { get; set; }

    public virtual User Owner { get; set; } = null!;
}
