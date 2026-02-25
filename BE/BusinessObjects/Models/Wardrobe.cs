using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Wardrobe
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public DateTime? CreateDate { get; set; }

    public virtual ICollection<ClothingItem> ClothingItems { get; set; } = new List<ClothingItem>();

    public virtual User User { get; set; } = null!;
}
