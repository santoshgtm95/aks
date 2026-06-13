using AKZ.API.Data;
using AKZ.API.Models;

namespace AKZ.API.Services;

public interface IAuditLogService
{
    Task LogCustomActionAsync(string action, string entityName, string? entityId = null, string? details = null, decimal? amount = null);
}

public class AuditLogService : IAuditLogService
{
    private readonly AKZDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuditLogService(AKZDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task LogCustomActionAsync(string action, string entityName, string? entityId = null, string? details = null, decimal? amount = null)
    {
        var username = _currentUserService.GetUsername() ?? "System";
        var userId = _currentUserService.GetUserId();

        var log = new AuditLog
        {
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            Amount = amount,
            UserId = userId,
            CreateBy = username,
            UpdateBy = username,
            CreateDate = DateTime.UtcNow.AddHours(6.5),
            UpdateDate = DateTime.UtcNow.AddHours(6.5)
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
