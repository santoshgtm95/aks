using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using AKZ.API.Models;

namespace AKZ.API.Data;

public class AuditEntry
{
    public EntityEntry Entry { get; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Dictionary<string, object?> KeyValues { get; } = new Dictionary<string, object?>();
    public Dictionary<string, object?> OldValues { get; } = new Dictionary<string, object?>();
    public Dictionary<string, object?> NewValues { get; } = new Dictionary<string, object?>();
    public List<PropertyEntry> TemporaryProperties { get; } = new List<PropertyEntry>();

    public string Username { get; set; } = "System";
    public int? UserId { get; set; }
    public decimal? Amount { get; set; }

    public AuditEntry(EntityEntry entry)
    {
        Entry = entry;
    }

    public bool HasTemporaryProperties => TemporaryProperties.Any();

    public AuditLog ToAuditLog()
    {
        return new AuditLog
        {
            Action = Action,
            EntityName = EntityName,
            EntityId = JsonSerializer.Serialize(KeyValues),
            Details = JsonSerializer.Serialize(new
            {
                OldValues = OldValues.Count == 0 ? null : OldValues,
                NewValues = NewValues.Count == 0 ? null : NewValues
            }),
            CreateBy = Username,
            UpdateBy = Username,
            CreateDate = DateTime.UtcNow.AddHours(6.5),
            UpdateDate = DateTime.UtcNow.AddHours(6.5),
            UserId = UserId,
            Amount = Amount
        };
    }
}
