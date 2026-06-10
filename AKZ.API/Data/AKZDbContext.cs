using Microsoft.EntityFrameworkCore;
using AKZ.API.Models;
using AKZ.API.Services;

namespace AKZ.API.Data;

public class AKZDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public AKZDbContext(DbContextOptions<AKZDbContext> options, ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<ProcessingRecord> ProcessingRecords { get; set; }
    public DbSet<Worker> Workers { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }
    public DbSet<PurificationProcess> PurificationProcesses { get; set; }
    public DbSet<Purifier> Purifiers { get; set; }
    public DbSet<Place> Places { get; set; }
    public DbSet<PurifiedRecord> PurifiedRecords { get; set; }
    public DbSet<PurificationWorker> PurificationWorkers { get; set; }
    public DbSet<RefinementProcess> RefinementProcesses { get; set; }
    public DbSet<RefinementRecord> RefinementRecords { get; set; }
    public DbSet<RefinementWorker> RefinementWorkers { get; set; }
    public DbSet<SingleDoubleDrawnRecord> SingleDoubleDrawnRecords { get; set; }
    public DbSet<SingleDoubleDrawnWorker> SingleDoubleDrawnWorkers { get; set; }
    public DbSet<SemiExportRecord> SemiExportRecords { get; set; }
    public DbSet<Ledger> Ledgers { get; set; }
    public DbSet<LedgerMarker> LedgerMarkers { get; set; }
    public DbSet<ExchangeRate> ExchangeRates { get; set; }
    public DbSet<Export> Exports { get; set; }
    public DbSet<ExportColorPrice> ExportColorPrices { get; set; }
    public DbSet<ImportedSemiExport> ImportedSemiExports { get; set; }
    public DbSet<WorkerPayment> WorkerPayments { get; set; }
    public DbSet<MessLabourWorker> MessLabourWorkers { get; set; }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var username = _currentUserService.GetUsername() ?? "System";
        var now = DateTime.UtcNow.AddHours(6.5);

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.DeleteFlg = 0;
                    entry.Entity.CreateDate = now;
                    entry.Entity.CreateBy = username;
                    entry.Entity.UpdateDate = now;
                    entry.Entity.UpdateBy = username;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdateDate = now;
                    entry.Entity.UpdateBy = username;
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.DeleteFlg = 1;
                    entry.Entity.DeleteDate = now;
                    entry.Entity.DeleteBy = username;
                    entry.Entity.UpdateDate = now;
                    entry.Entity.UpdateBy = username;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply global query filters for soft delete
        modelBuilder.Entity<User>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Role>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Permission>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RolePermission>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Product>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Sale>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<ProcessingRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Worker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Warehouse>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<UserPermission>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<PurificationProcess>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Purifier>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RefinementWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Ledger>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<LedgerMarker>().HasQueryFilter(e => e.DeleteFlg == 0);

        // Configure ProcessingRecord relationship
        modelBuilder.Entity<ProcessingRecord>()
            .HasOne(pr => pr.Product)
            .WithMany()
            .HasForeignKey(pr => pr.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .HasFilter("[DeleteFlg] = 0")
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .HasFilter("[DeleteFlg] = 0")
            .IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();

        modelBuilder.Entity<Permission>()
            .HasIndex(p => p.Name)
            .IsUnique();

        // Configure relationships
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Product)
            .WithMany(p => p.Sales)
            .HasForeignKey(s => s.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Seller)
            .WithMany(u => u.Sales)
            .HasForeignKey(s => s.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Warehouse)
            .WithMany(w => w.Products)
            .HasForeignKey(p => p.WarehouseId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.User)
            .WithMany()
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.Permission)
            .WithMany()
            .HasForeignKey(up => up.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Purifier>()
            .HasOne(p => p.Warehouse)
            .WithMany()
            .HasForeignKey(p => p.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementWorker>()
            .HasOne(p => p.Warehouse)
            .WithMany()
            .HasForeignKey(p => p.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurificationProcess>()
            .HasOne(p => p.Place)
            .WithMany()
            .HasForeignKey(p => p.PlaceId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<PurifiedRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RefinementProcess>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RefinementRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SingleDoubleDrawnRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SingleDoubleDrawnWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SemiExportRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<ExchangeRate>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Export>().HasQueryFilter(e => e.DeleteFlg == 0);

        modelBuilder.Entity<RefinementProcess>()
            .HasOne(r => r.PurifiedRecord)
            .WithMany()
            .HasForeignKey(r => r.PurifiedRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SingleDoubleDrawnRecord>()
            .HasOne(s => s.RefinementRecord)
            .WithMany()
            .HasForeignKey(s => s.RefinementRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SemiExportRecord>()
            .HasOne(s => s.SingleDoubleDrawnRecord)
            .WithMany()
            .HasForeignKey(s => s.SingleDoubleDrawnRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementProcess>()
            .HasOne(r => r.RefinementWorker)
            .WithMany()
            .HasForeignKey(r => r.RefinementWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.PurifiedRecord)
            .WithMany()
            .HasForeignKey(r => r.PurifiedRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.RefinementWorker)
            .WithMany()
            .HasForeignKey(r => r.RefinementWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.RefinementProcess)
            .WithMany(p => p.RefinementRecords)
            .HasForeignKey(r => r.RefinementProcessId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
