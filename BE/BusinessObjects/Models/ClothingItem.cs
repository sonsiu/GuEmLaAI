using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class ClothingItem
{
    public int Id { get; set; }

    public int WardrobeId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Hashtags { get; set; }

    public DateTime? UploadDate { get; set; }

    public virtual Wardrobe Wardrobe { get; set; } = null!;
}
