using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Item
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? CategoryCode { get; set; }

    public string ImagePreview { get; set; } = null!;

    public bool IsPublic { get; set; }

    public bool IsFavorite { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Size { get; set; }

    public int WearCount { get; set; }

    public string? Description { get; set; }

    public string? Purpose { get; set; }

    public virtual ItemCategory? CategoryCodeNavigation { get; set; }

    public virtual ICollection<ItemColor> ItemColors { get; set; } = new List<ItemColor>();

    public virtual ICollection<ItemOccasion> ItemOccasions { get; set; } = new List<ItemOccasion>();

    public virtual ICollection<ItemSeason> ItemSeasons { get; set; } = new List<ItemSeason>();

    public virtual ICollection<ItemSize> ItemSizes { get; set; } = new List<ItemSize>();

    public virtual ICollection<ItemWearCount> ItemWearCounts { get; set; } = new List<ItemWearCount>();

    public virtual ICollection<ItemWearHistory> ItemWearHistories { get; set; } = new List<ItemWearHistory>();

    public virtual User User { get; set; } = null!;
}
