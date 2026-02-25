using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class GuEmLaAiContext : DbContext
{
    public GuEmLaAiContext()
    {
    }

    public GuEmLaAiContext(DbContextOptions<GuEmLaAiContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Board> Boards { get; set; }

    public virtual DbSet<BoardImage> BoardImages { get; set; }

    public virtual DbSet<BoardItem> BoardItems { get; set; }

    public virtual DbSet<BoardOutfit> BoardOutfits { get; set; }

    public virtual DbSet<CalendarDay> CalendarDays { get; set; }

    public virtual DbSet<ClothingItem> ClothingItems { get; set; }

    public virtual DbSet<Collection> Collections { get; set; }

    public virtual DbSet<CollectionOutfit> CollectionOutfits { get; set; }

    public virtual DbSet<CreditTransaction> CreditTransactions { get; set; }

    public virtual DbSet<DailyOutfitPlan> DailyOutfitPlans { get; set; }

    public virtual DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }

    public virtual DbSet<HistoryBoard> HistoryBoards { get; set; }

    public virtual DbSet<HttpRequestLog> HttpRequestLogs { get; set; }

    public virtual DbSet<ImageGenerated> ImageGenerateds { get; set; }

    public virtual DbSet<Item> Items { get; set; }

    public virtual DbSet<ItemCategory> ItemCategories { get; set; }

    public virtual DbSet<ItemColor> ItemColors { get; set; }

    public virtual DbSet<ItemOccasion> ItemOccasions { get; set; }

    public virtual DbSet<ItemSeason> ItemSeasons { get; set; }

    public virtual DbSet<ItemSize> ItemSizes { get; set; }

    public virtual DbSet<ItemWearCount> ItemWearCounts { get; set; }

    public virtual DbSet<ItemWearHistory> ItemWearHistories { get; set; }

    public virtual DbSet<Model> Models { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Outfit> Outfits { get; set; }

    public virtual DbSet<OutfitImage> OutfitImages { get; set; }

    public virtual DbSet<OutfitSeason> OutfitSeasons { get; set; }

    public virtual DbSet<OutfitSuggestion> OutfitSuggestions { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PublicCollectionItem> PublicCollectionItems { get; set; }

    public virtual DbSet<PublicCollectionOutfit> PublicCollectionOutfits { get; set; }

    public virtual DbSet<PublicOutfitSeason> PublicOutfitSeasons { get; set; }

    public virtual DbSet<SavedCollection> SavedCollections { get; set; }

    public virtual DbSet<Sysdiagram> Sysdiagrams { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Wardrobe> Wardrobes { get; set; }

    public virtual DbSet<WebsiteAnalytic> WebsiteAnalytics { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection");
            optionsBuilder.UseMySql(connectionString, Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.44-mysql"));
        }
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("board");

            entity.HasIndex(e => e.ImagePreview, "FK_Board_CoverImage");

            entity.HasIndex(e => e.OwnerId, "FK_Board_User");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.ImagePreview).HasColumnName("image_preview");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");

            entity.HasOne(d => d.ImagePreviewNavigation).WithMany(p => p.Boards)
                .HasForeignKey(d => d.ImagePreview)
                .HasConstraintName("FK_Board_CoverImage");

            entity.HasOne(d => d.Owner).WithMany(p => p.Boards)
                .HasForeignKey(d => d.OwnerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Board_User");
        });

        modelBuilder.Entity<BoardImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("board_image");

            entity.HasIndex(e => e.BoardId, "FK_BoardImage_Board");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BoardId).HasColumnName("boardId");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("createdAt");
            entity.Property(e => e.Picture).HasColumnName("picture");

            entity.HasOne(d => d.Board).WithMany(p => p.BoardImages)
                .HasForeignKey(d => d.BoardId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BoardImage_Board");
        });

        modelBuilder.Entity<BoardItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("board_item");

            entity.HasIndex(e => e.BoardId, "board_item_board_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.ItemPreview)
                .HasMaxLength(200)
                .HasColumnName("item_preview");
            entity.Property(e => e.Status).HasColumnName("status");

            entity.HasOne(d => d.Board).WithMany(p => p.BoardItems)
                .HasForeignKey(d => d.BoardId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("board_item_board_id_fk");
        });

        modelBuilder.Entity<BoardOutfit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("board_outfit");

            entity.HasIndex(e => e.BoardId, "board_outfit_board_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.ImagePreview)
                .HasMaxLength(200)
                .HasColumnName("image_preview");
            entity.Property(e => e.JsonTemplate)
                .HasMaxLength(0)
                .HasColumnName("json_template");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.Status).HasColumnName("status");

            entity.HasOne(d => d.Board).WithMany(p => p.BoardOutfits)
                .HasForeignKey(d => d.BoardId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("board_outfit_board_id_fk");
        });

        modelBuilder.Entity<CalendarDay>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("calendar_day");

            entity.HasIndex(e => e.UserId, "calendar_day_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.JsonTemplate).HasColumnName("json_template");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.CalendarDays)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("calendar_day_user_id_fk");
        });

        modelBuilder.Entity<ClothingItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("clothing_item");

            entity.HasIndex(e => e.WardrobeId, "FK_clothing_wardrobe");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.Hashtags)
                .HasMaxLength(200)
                .HasColumnName("hashtags");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.UploadDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("upload_date");
            entity.Property(e => e.WardrobeId).HasColumnName("wardrobe_id");

            entity.HasOne(d => d.Wardrobe).WithMany(p => p.ClothingItems)
                .HasForeignKey(d => d.WardrobeId)
                .HasConstraintName("FK_clothing_wardrobe");
        });

        modelBuilder.Entity<Collection>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("collection");

            entity.HasIndex(e => e.UserId, "collection_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.ImageCover)
                .HasMaxLength(200)
                .HasColumnName("image_cover");
            entity.Property(e => e.IsPublic).HasColumnName("is_public");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Collections)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("collection_user_id_fk");
        });

        modelBuilder.Entity<CollectionOutfit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("collection_outfit");

            entity.HasIndex(e => new { e.CollectionId, e.OutfitId }, "UQ_collection_outfit").IsUnique();

            entity.HasIndex(e => e.OutfitId, "collection_outfit_outfit_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("added_at");
            entity.Property(e => e.CollectionId).HasColumnName("collection_id");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");

            entity.HasOne(d => d.Collection).WithMany(p => p.CollectionOutfits)
                .HasForeignKey(d => d.CollectionId)
                .HasConstraintName("collection_outfit_collection_id_fk");

            entity.HasOne(d => d.Outfit).WithMany(p => p.CollectionOutfits)
                .HasForeignKey(d => d.OutfitId)
                .HasConstraintName("collection_outfit_outfit_id_fk");
        });

        modelBuilder.Entity<CreditTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("credit_transactions");

            entity.HasIndex(e => e.PaymentId, "FK_credit_transactions_payment");

            entity.HasIndex(e => e.UserId, "FK_credit_transactions_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount).HasColumnName("amount");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.ReferenceId)
                .HasMaxLength(100)
                .HasColumnName("reference_id");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Payment).WithMany(p => p.CreditTransactions)
                .HasForeignKey(d => d.PaymentId)
                .HasConstraintName("FK_credit_transactions_payment");

            entity.HasOne(d => d.User).WithMany(p => p.CreditTransactions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_credit_transactions_user");
        });

        modelBuilder.Entity<DailyOutfitPlan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("daily_outfit_plan");

            entity.HasIndex(e => e.OutfitId, "daily_outfit_plan_outfit_id_fk");

            entity.HasIndex(e => new { e.UserId, e.PlanDate }, "daily_outfit_plan_unique").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.IsWorn).HasColumnName("is_worn");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.PlanDate).HasColumnName("plan_date");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WornAt)
                .HasMaxLength(6)
                .HasColumnName("worn_at");

            entity.HasOne(d => d.Outfit).WithMany(p => p.DailyOutfitPlans)
                .HasForeignKey(d => d.OutfitId)
                .HasConstraintName("daily_outfit_plan_outfit_id_fk");

            entity.HasOne(d => d.User).WithMany(p => p.DailyOutfitPlans)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("daily_outfit_plan_user_id_fk");
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("email_verification_tokens");

            entity.HasIndex(e => e.UserId, "FK_EmailVerificationTokens_User");

            entity.Property(e => e.Id).HasMaxLength(64);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.EmailVerificationTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmailVerificationTokens_User");
        });

        modelBuilder.Entity<HistoryBoard>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("history_board");

            entity.HasIndex(e => e.UserId, "userId");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("createdAt");
            entity.Property(e => e.ExpiredAt)
                .HasMaxLength(6)
                .HasColumnName("expiredAt");
            entity.Property(e => e.Image)
                .HasMaxLength(200)
                .HasColumnName("image");
            entity.Property(e => e.ItemJsonTemplate).HasColumnName("item_json_template");
            entity.Property(e => e.UserId).HasColumnName("userId");

            entity.HasOne(d => d.User).WithMany(p => p.HistoryBoards)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("userId");
        });

        modelBuilder.Entity<HttpRequestLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("http_request_logs");

            entity.HasIndex(e => e.Path, "ix_http_request_logs_path");

            entity.HasIndex(e => e.RequestTime, "ix_http_request_logs_request_time");

            entity.HasIndex(e => e.UserId, "ix_http_request_logs_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Action)
                .HasMaxLength(100)
                .HasColumnName("action");
            entity.Property(e => e.Controller)
                .HasMaxLength(100)
                .HasColumnName("controller");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.ElapsedMilliseconds).HasColumnName("elapsed_milliseconds");
            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(1000)
                .HasColumnName("error_message");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .HasColumnName("ip_address");
            entity.Property(e => e.Method)
                .HasMaxLength(10)
                .HasColumnName("method");
            entity.Property(e => e.Path)
                .HasMaxLength(500)
                .HasColumnName("path");
            entity.Property(e => e.QueryString)
                .HasMaxLength(1000)
                .HasColumnName("query_string");
            entity.Property(e => e.RequestBody).HasColumnName("request_body");
            entity.Property(e => e.RequestSizeBytes).HasColumnName("request_size_bytes");
            entity.Property(e => e.RequestTime)
                .HasColumnType("datetime")
                .HasColumnName("request_time");
            entity.Property(e => e.ResponseBody).HasColumnName("response_body");
            entity.Property(e => e.ResponseSizeBytes).HasColumnName("response_size_bytes");
            entity.Property(e => e.StatusCode).HasColumnName("status_code");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.HttpRequestLogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("http_request_logs_user_id_fk");
        });

        modelBuilder.Entity<ImageGenerated>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("image_generated");

            entity.HasIndex(e => e.UserId, "FK_image_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Created)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created");
            entity.Property(e => e.Image)
                .HasMaxLength(200)
                .HasColumnName("image");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.ImageGenerateds)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_image_user");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item");

            entity.HasIndex(e => e.CategoryCode, "FK_item_itemcategory");

            entity.HasIndex(e => e.UserId, "item_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(50)
                .HasColumnName("category_code");
            entity.Property(e => e.Comment)
                .HasMaxLength(500)
                .HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.ImagePreview)
                .HasMaxLength(200)
                .HasColumnName("image_preview");
            entity.Property(e => e.IsFavorite).HasColumnName("is_favorite");
            entity.Property(e => e.IsPublic).HasColumnName("is_public");
            entity.Property(e => e.Purpose)
                .HasMaxLength(20)
                .HasColumnName("purpose");
            entity.Property(e => e.Size)
                .HasMaxLength(100)
                .HasColumnName("size");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WearCount).HasColumnName("wear_count");

            entity.HasOne(d => d.CategoryCodeNavigation).WithMany(p => p.Items)
                .HasPrincipalKey(p => p.CategoryCode)
                .HasForeignKey(d => d.CategoryCode)
                .HasConstraintName("FK_item_itemcategory");

            entity.HasOne(d => d.User).WithMany(p => p.Items)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_user_id_fk");
        });

        modelBuilder.Entity<ItemCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_category");

            entity.HasIndex(e => e.CategoryCode, "UQ__item_cat__BC9D1E7C38ACE0CF").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(50)
                .HasColumnName("category_code");
            entity.Property(e => e.SoftPurpose)
                .HasMaxLength(20)
                .HasColumnName("soft_purpose");
        });

        modelBuilder.Entity<ItemColor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_color");

            entity.HasIndex(e => e.ItemId, "item_color_item_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ColorName)
                .HasMaxLength(50)
                .HasColumnName("color_name");
            entity.Property(e => e.ItemId).HasColumnName("item_id");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemColors)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_color_item_id_fk");
        });

        modelBuilder.Entity<ItemOccasion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_occasion");

            entity.HasIndex(e => e.ItemId, "item_occasion_item_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.OccasionName)
                .HasMaxLength(200)
                .HasColumnName("occasion_name");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemOccasions)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_occasion_item_id_fk");
        });

        modelBuilder.Entity<ItemSeason>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_season");

            entity.HasIndex(e => e.ItemId, "item_season_item_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(50)
                .HasColumnName("season_name");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemSeasons)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_season_item_id_fk");
        });

        modelBuilder.Entity<ItemSize>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_size");

            entity.HasIndex(e => e.ItemId, "item_size_item_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.SizeName)
                .HasMaxLength(50)
                .HasColumnName("size_name");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemSizes)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_size_item_id_fk");
        });

        modelBuilder.Entity<ItemWearCount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_wear_count");

            entity.HasIndex(e => new { e.UserId, e.ItemId }, "idx_item_wear_count_user_item").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.LastWornDate)
                .HasMaxLength(6)
                .HasColumnName("last_worn_date");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WearCount).HasColumnName("wear_count");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemWearCounts)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_wear_count_item_id_fk");

            entity.HasOne(d => d.User).WithMany(p => p.ItemWearCounts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_wear_count_user_id_fk");
        });

        modelBuilder.Entity<ItemWearHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("item_wear_history");

            entity.HasIndex(e => new { e.UserId, e.WornDate }, "idx_item_wear_history_user_date");

            entity.HasIndex(e => e.ItemId, "item_wear_history_item_id_fk");

            entity.HasIndex(e => e.OutfitId, "item_wear_history_outfit_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WornDate).HasColumnName("worn_date");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemWearHistories)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_wear_history_item_id_fk");

            entity.HasOne(d => d.Outfit).WithMany(p => p.ItemWearHistories)
                .HasForeignKey(d => d.OutfitId)
                .HasConstraintName("item_wear_history_outfit_id_fk");

            entity.HasOne(d => d.User).WithMany(p => p.ItemWearHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_wear_history_user_id_fk");
        });

        modelBuilder.Entity<Model>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("model")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.UserId, "model_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ImageName)
                .HasMaxLength(200)
                .HasColumnName("image_name")
                .UseCollation("utf8mb3_general_ci")
                .HasCharSet("utf8mb3");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Models)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("model_user_id_fk");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("notification");

            entity.HasIndex(e => e.UserId, "notification_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content)
                .HasMaxLength(200)
                .HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("notification_user_id_fk");
        });

        modelBuilder.Entity<Outfit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("outfit");

            entity.HasIndex(e => e.UserId, "outfit_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Comment)
                .HasMaxLength(300)
                .HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasMaxLength(6)
                .HasColumnName("created_at");
            entity.Property(e => e.ImagePreview)
                .HasMaxLength(200)
                .HasColumnName("image_preview");
            entity.Property(e => e.IsFavorite).HasColumnName("is_favorite");
            entity.Property(e => e.IsPublic).HasColumnName("is_public");
            entity.Property(e => e.JsonTemplate).HasColumnName("json_template");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.UpdatedAt)
                .HasMaxLength(6)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WearCount).HasColumnName("wear_count");

            entity.HasOne(d => d.User).WithMany(p => p.Outfits)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outfit_user_id_fk");
        });

        modelBuilder.Entity<OutfitImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("outfit_images")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.OutfitId, "outfit_images_outfit_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ImageName)
                .HasMaxLength(200)
                .HasColumnName("image_name")
                .UseCollation("utf8mb3_general_ci")
                .HasCharSet("utf8mb3");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");

            entity.HasOne(d => d.Outfit).WithMany(p => p.OutfitImages)
                .HasForeignKey(d => d.OutfitId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outfit_images_outfit_id_fk");
        });

        modelBuilder.Entity<OutfitSeason>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("outfit_season");

            entity.HasIndex(e => e.OutfitId, "outfit_season_outfit_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(50)
                .HasColumnName("season_name");

            entity.HasOne(d => d.Outfit).WithMany(p => p.OutfitSeasons)
                .HasForeignKey(d => d.OutfitId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("outfit_season_outfit_id_fk");
        });

        modelBuilder.Entity<OutfitSuggestion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("outfit_suggestion")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "idx_user_created").IsDescending(false, true);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.ModelImageUrl)
                .HasMaxLength(512)
                .HasColumnName("model_image_url");
            entity.Property(e => e.Options)
                .HasColumnType("json")
                .HasColumnName("options");
            entity.Property(e => e.PreviewImageUrl)
                .HasMaxLength(512)
                .HasColumnName("preview_image_url");
            entity.Property(e => e.QueryText)
                .HasColumnType("text")
                .HasColumnName("query_text");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WardrobeVersion)
                .HasMaxLength(191)
                .HasColumnName("wardrobe_version");

            entity.HasOne(d => d.User).WithMany(p => p.OutfitSuggestions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_outfit_suggestions_user");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("password_reset_token");

            entity.HasIndex(e => e.UserId, "FK_PasswordResetTokens_User");

            entity.Property(e => e.Id).HasMaxLength(64);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.ValidatorHash).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PasswordResetTokens_User");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("payments");

            entity.HasIndex(e => e.UserId, "FK_payments_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount).HasColumnName("amount");
            entity.Property(e => e.CheckoutUrl)
                .HasMaxLength(500)
                .HasColumnName("checkout_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.OrderCode).HasColumnName("order_code");
            entity.Property(e => e.PaidAt)
                .HasMaxLength(6)
                .HasColumnName("paid_at");
            entity.Property(e => e.PaymentUrl)
                .HasMaxLength(500)
                .HasColumnName("payment_url");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasColumnName("status");
            entity.Property(e => e.TransactionId)
                .HasMaxLength(100)
                .HasColumnName("transaction_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Payments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_payments_user");
        });

        modelBuilder.Entity<PublicCollectionItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("public_collection_item");

            entity.HasIndex(e => e.OutfitId, "public_collection_item_outfit_fk");

            entity.HasIndex(e => e.Id, "public_collection_item_pk").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BuyLink)
                .HasMaxLength(500)
                .HasColumnName("buy_link");
            entity.Property(e => e.Color)
                .HasMaxLength(100)
                .HasColumnName("color");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.ImagePreview)
                .HasMaxLength(200)
                .HasColumnName("image_preview");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Outfit).WithMany(p => p.PublicCollectionItems)
                .HasForeignKey(d => d.OutfitId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("public_collection_item_outfit_fk");
        });

        modelBuilder.Entity<PublicCollectionOutfit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("public_collection_outfit");

            entity.HasIndex(e => e.Id, "public_collection_outfit_pk").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.ImagePreview)
                .HasMaxLength(200)
                .HasColumnName("image_preview");
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'")
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<PublicOutfitSeason>(entity =>
        {
            entity.HasKey(e => new { e.OutfitId, e.SeasonName })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("public_outfit_season");

            entity.Property(e => e.OutfitId).HasColumnName("outfit_id");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(50)
                .HasColumnName("season_name");

            entity.HasOne(d => d.Outfit).WithMany(p => p.PublicOutfitSeasons)
                .HasForeignKey(d => d.OutfitId)
                .HasConstraintName("public_outfit_season_outfit_fk");
        });

        modelBuilder.Entity<SavedCollection>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("saved_collection");

            entity.HasIndex(e => e.UserId, "FK_saved_collection_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(20)
                .HasColumnName("name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.SavedCollections)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_saved_collection_user");
        });

        modelBuilder.Entity<Sysdiagram>(entity =>
        {
            entity.HasKey(e => e.DiagramId).HasName("PRIMARY");

            entity.ToTable("sysdiagrams");

            entity.HasIndex(e => new { e.PrincipalId, e.Name }, "UK_principal_name").IsUnique();

            entity.Property(e => e.DiagramId).HasColumnName("diagram_id");
            entity.Property(e => e.Definition).HasColumnName("definition");
            entity.Property(e => e.Name)
                .HasMaxLength(160)
                .HasColumnName("name");
            entity.Property(e => e.PrincipalId).HasColumnName("principal_id");
            entity.Property(e => e.Version).HasColumnName("version");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("user");

            entity.HasIndex(e => e.Email, "UQ__user__AB6E6164769AA3BE").IsUnique();

            entity.HasIndex(e => e.ReferralCode, "UQ__user__B7456514E9BB38C3").IsUnique();

            entity.HasIndex(e => e.ReferredById, "user_user_id_fk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AvailableToken)
                .HasDefaultValueSql("'0'")
                .HasColumnName("available_token");
            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("create_date");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(100)
                .HasColumnName("display_name");
            entity.Property(e => e.Email)
                .HasMaxLength(30)
                .HasColumnName("email");
            entity.Property(e => e.ItemUploadCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("item_upload_count");
            entity.Property(e => e.MaxImageGenerated)
                .HasDefaultValueSql("'20'")
                .HasColumnName("max_image_generated");
            entity.Property(e => e.MaxItemGenerated)
                .HasDefaultValueSql("'20'")
                .HasColumnName("max_item_generated");
            entity.Property(e => e.MaxModelCreated)
                .HasDefaultValueSql("'20'")
                .HasColumnName("max_model_created");
            entity.Property(e => e.ModelPicture)
                .HasMaxLength(200)
                .HasColumnName("model_picture");
            entity.Property(e => e.OutfitUploadCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("outfit_upload_count");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.ProfilePicture)
                .HasMaxLength(200)
                .HasColumnName("profile_picture");
            entity.Property(e => e.ReferralCode)
                .HasMaxLength(20)
                .HasColumnName("referral_code");
            entity.Property(e => e.ReferralStatus)
                .HasMaxLength(20)
                .HasColumnName("referral_status");
            entity.Property(e => e.ReferredById).HasColumnName("referred_by_id");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.TodayImageGeneratedCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("today_image_generated_count");
            entity.Property(e => e.TodayItemGeneratedCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("today_item_generated_count");
            entity.Property(e => e.TodayModelPictureCreatedCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("today_model_picture_created_count");
            entity.Property(e => e.UpdatedAt).HasMaxLength(6);
            entity.Property(e => e.Username)
                .HasMaxLength(20)
                .HasColumnName("username");
            entity.Property(e => e.VirtualTryOnUsedCount)
                .HasDefaultValueSql("'0'")
                .HasColumnName("virtual_try_on_used_count");

            entity.HasOne(d => d.ReferredBy).WithMany(p => p.InverseReferredBy)
                .HasForeignKey(d => d.ReferredById)
                .HasConstraintName("user_user_id_fk");
        });

        modelBuilder.Entity<Wardrobe>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("wardrobe");

            entity.HasIndex(e => e.UserId, "UQ__wardrobe__B9BE370E54FD894D").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("create_date");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Wardrobe)
                .HasForeignKey<Wardrobe>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_wardrobe_user");
        });

        modelBuilder.Entity<WebsiteAnalytic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("website_analytics");

            entity.HasIndex(e => e.SessionId, "ix_website_analytics_session_id");

            entity.HasIndex(e => e.UserId, "ix_website_analytics_user_id");

            entity.HasIndex(e => e.VisitDate, "ix_website_analytics_visit_date");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .HasColumnName("ip_address");
            entity.Property(e => e.PageUrl)
                .HasMaxLength(500)
                .HasColumnName("page_url");
            entity.Property(e => e.SessionId)
                .HasMaxLength(100)
                .HasColumnName("session_id");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VisitDate)
                .HasMaxLength(6)
                .HasColumnName("visit_date");

            entity.HasOne(d => d.User).WithMany(p => p.WebsiteAnalytics)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("website_analytics_user_id_fk");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
