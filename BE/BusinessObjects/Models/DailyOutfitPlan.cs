using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class DailyOutfitPlan
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? OutfitId { get; set; }

    public DateOnly PlanDate { get; set; }

    public bool IsWorn { get; set; }

    public DateTime? WornAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Outfit? Outfit { get; set; }

    public virtual User User { get; set; } = null!;
}
