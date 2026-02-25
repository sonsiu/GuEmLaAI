using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class Outfit
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Name { get; set; }

    public string ImagePreview { get; set; } = null!;

    public string? JsonTemplate { get; set; }

    public bool IsPublic { get; set; }

    public bool IsFavorite { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int WearCount { get; set; }

    public virtual ICollection<CollectionOutfit> CollectionOutfits { get; set; } = new List<CollectionOutfit>();

    public virtual ICollection<DailyOutfitPlan> DailyOutfitPlans { get; set; } = new List<DailyOutfitPlan>();

    public virtual ICollection<ItemWearHistory> ItemWearHistories { get; set; } = new List<ItemWearHistory>();

    public virtual ICollection<OutfitImage> OutfitImages { get; set; } = new List<OutfitImage>();

    public virtual ICollection<OutfitSeason> OutfitSeasons { get; set; } = new List<OutfitSeason>();

    public virtual User User { get; set; } = null!;
}
