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
    public DbSet<RefiningProcess> RefiningProcesses { get; set; }
    public DbSet<RefinementRecord> RefinementRecords { get; set; }
    public DbSet<RefinementWorker> RefinementWorkers { get; set; }
    public DbSet<SingleDoubleDrawnRecord> SingleDoubleDrawnRecords { get; set; }
    public DbSet<SingleDoubleDrawnWorker> SingleDoubleDrawnWorkers { get; set; }
    public DbSet<SemiExportRecord> SemiExportRecords { get; set; }
    public DbSet<SemiExportPurchase> SemiExportPurchases { get; set; }
    public DbSet<SemiExportPurchaseProcessing> SemiExportPurchaseProcessings { get; set; }
    public DbSet<SemiExportPurchaseRecord> SemiExportPurchaseRecords { get; set; }
    public DbSet<Ledger> Ledgers { get; set; }
    public DbSet<LedgerMarker> LedgerMarkers { get; set; }
    public DbSet<ExchangeRate> ExchangeRates { get; set; }
    public DbSet<Export> Exports { get; set; }
    public DbSet<ExportColorPrice> ExportColorPrices { get; set; }
    public DbSet<ImportedSemiExport> ImportedSemiExports { get; set; }
    public DbSet<WorkerPayment> WorkerPayments { get; set; }
    public DbSet<MessLabourWorker> MessLabourWorkers { get; set; }
    public DbSet<ProcessingRecordWorker> ProcessingRecordWorkers { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<WashGradingWorker> WashGradingWorkers { get; set; }
    public DbSet<WashGradingProcess> WashGradingProcesses { get; set; }
    public DbSet<WashGradingRecord> WashGradingRecords { get; set; }


    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var username = _currentUserService.GetUsername() ?? "System";
        var userId = _currentUserService.GetUserId();
        var now = DateTime.UtcNow.AddHours(6.5);

        var auditEntries = OnBeforeSaveChanges(username, userId);

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.Entity is AuditLog) continue; // Do not audit the AuditLog itself

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

        var result = await base.SaveChangesAsync(cancellationToken);
        await OnAfterSaveChanges(auditEntries);
        return result;
    }

    private List<AuditEntry> OnBeforeSaveChanges(string username, int? userId)
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                EntityName = entry.Entity.GetType().Name,
                Username = username,
                UserId = userId,
                Action = entry.State == EntityState.Added ? "Insert" : entry.State == EntityState.Deleted ? "Delete" : "Update"
            };

            // Exception for logical delete
            if (entry.State == EntityState.Modified && entry.Entity is BaseEntity entity && entry.Property("DeleteFlg").IsModified)
            {
                if (entity.DeleteFlg == 1)
                {
                    auditEntry.Action = "Delete";
                }
            }

            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                if (property.IsTemporary)
                {
                    auditEntry.TemporaryProperties.Add(property);
                    continue;
                }

                string propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                }

                if (property.CurrentValue is float or double or decimal)
                {
                    var doubleVal = Convert.ToDecimal(property.CurrentValue);
                    if (propertyName.Contains("Count", StringComparison.OrdinalIgnoreCase) && auditEntry.Action != "Delete")
                    {
                        if (property.IsModified && entry.State == EntityState.Modified)
                        {
                            var oldVal = Convert.ToDecimal(property.OriginalValue);
                            if (doubleVal != oldVal)
                            {
                                auditEntry.Amount = doubleVal - oldVal; // Difference
                                auditEntry.Action = "Count Update";
                            }
                        }
                    }
                    if (propertyName.Contains("Fee", StringComparison.OrdinalIgnoreCase) || propertyName.Contains("Payment", StringComparison.OrdinalIgnoreCase))
                    {
                        if (property.IsModified && entry.State == EntityState.Modified)
                        {
                            var oldVal = Convert.ToDecimal(property.OriginalValue);
                            if (doubleVal != oldVal)
                            {
                                auditEntry.Amount = doubleVal - oldVal;
                                auditEntry.Action = "Fee Update";
                            }
                        }
                        else if (entry.State == EntityState.Added)
                        {
                            auditEntry.Amount = doubleVal;
                        }
                    }
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }
        }

        foreach (var auditEntry in auditEntries.Where(_ => !_.HasTemporaryProperties))
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        return auditEntries.Where(_ => _.HasTemporaryProperties).ToList();
    }

    private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
    {
        if (auditEntries == null || auditEntries.Count == 0)
            return Task.CompletedTask;

        foreach (var auditEntry in auditEntries)
        {
            foreach (var prop in auditEntry.TemporaryProperties)
            {
                if (prop.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[prop.Metadata.Name] = prop.CurrentValue;
                }
                else
                {
                    auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                }
            }

            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        return base.SaveChangesAsync();
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
        modelBuilder.Entity<Place>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RefinementWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Ledger>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<LedgerMarker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(e => e.DeleteFlg == 0);

        // Configure ProcessingRecord relationship
        modelBuilder.Entity<ProcessingRecord>()
            .HasOne(pr => pr.Product)
            .WithMany()
            .HasForeignKey(pr => pr.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProcessingRecord>()
            .HasOne(pr => pr.WashGradingRecord)
            .WithMany()
            .HasForeignKey(pr => pr.WashGradingRecordId)
            .OnDelete(DeleteBehavior.SetNull);

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
        modelBuilder.Entity<RefiningProcess>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<RefinementRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SingleDoubleDrawnRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SingleDoubleDrawnWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SemiExportRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SemiExportPurchaseRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<ExchangeRate>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<Export>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<WashGradingWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<WashGradingProcess>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<WashGradingRecord>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SemiExportPurchase>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<SemiExportPurchaseProcessing>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<MessLabourWorker>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<ImportedSemiExport>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<WorkerPayment>().HasQueryFilter(e => e.DeleteFlg == 0);
        modelBuilder.Entity<PurificationWorker>().HasQueryFilter(e => e.DeleteFlg == 0);

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

        modelBuilder.Entity<SemiExportRecord>()
            .HasOne(s => s.SemiExportPurchaseRecord)
            .WithMany()
            .HasForeignKey(s => s.SemiExportPurchaseRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SemiExportPurchaseRecord>()
            .HasOne(r => r.SemiExportPurchaseProcessing)
            .WithMany()
            .HasForeignKey(r => r.SemiExportPurchaseProcessingId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SemiExportPurchaseRecord>()
            .HasOne(r => r.SemiExportPurchase)
            .WithMany()
            .HasForeignKey(r => r.SemiExportPurchaseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SemiExportPurchaseRecord>()
            .HasOne(r => r.ExchangeRate)
            .WithMany()
            .HasForeignKey(r => r.ExchangeRateId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RefinementProcess>()
            .HasOne(r => r.Worker)
            .WithMany()
            .HasForeignKey(r => r.RefinementWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.PurifiedRecord)
            .WithMany()
            .HasForeignKey(r => r.PurifiedRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.Worker)
            .WithMany()
            .HasForeignKey(r => r.RefinementWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.RefinementProcess)
            .WithMany(p => p.RefinementRecords)
            .HasForeignKey(r => r.RefinementProcessId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefiningProcess>()
            .HasOne(r => r.PurifiedRecord)
            .WithMany()
            .HasForeignKey(r => r.PurifiedRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefiningProcess>()
            .HasOne(r => r.Worker)
            .WithMany()
            .HasForeignKey(r => r.RefinementWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefiningProcess>()
            .HasOne(r => r.RefinementProcess)
            .WithMany(p => p.RefiningProcesses)
            .HasForeignKey(r => r.RefinementProcessId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefinementRecord>()
            .HasOne(r => r.RefiningProcess)
            .WithMany(p => p.RefinementRecords)
            .HasForeignKey(r => r.RefiningProcessId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingWorker>()
            .HasOne(p => p.Warehouse)
            .WithMany()
            .HasForeignKey(p => p.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingProcess>()
            .HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingProcess>()
            .HasOne(r => r.Worker)
            .WithMany()
            .HasForeignKey(r => r.WashGradingWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingRecord>()
            .HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingRecord>()
            .HasOne(r => r.Worker)
            .WithMany()
            .HasForeignKey(r => r.WashGradingWorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WashGradingRecord>()
            .HasOne(r => r.WashGradingProcess)
            .WithMany(p => p.WashGradingRecords)
            .HasForeignKey(r => r.WashGradingProcessId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
