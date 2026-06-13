using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

public class AuditLog : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty; // Insert, Update, Delete, Login, Logout, Count, WorkerFeesAdd

    [Required]
    [MaxLength(100)]
    public string EntityName { get; set; } = string.Empty; // Table name or Entity

    [MaxLength(100)]
    public string? EntityId { get; set; }

    public string? Details { get; set; } // JSON or text

    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Amount { get; set; } // For counts or worker fees
}
