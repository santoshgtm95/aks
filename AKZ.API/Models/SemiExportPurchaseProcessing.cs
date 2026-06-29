using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SemiExportPurchaseProcessings")]
public class SemiExportPurchaseProcessing : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SemiExportPurchaseId { get; set; }

    [ForeignKey("SemiExportPurchaseId")]
    public SemiExportPurchase? SemiExportPurchase { get; set; }

    [Required]
    public int WorkerId { get; set; }

    [ForeignKey("WorkerId")]
    public Worker? Worker { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal AssignWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LostWeight { get; set; }

    [Required]
    [MaxLength(100)]
    public string Status { get; set; } = "Processing";

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
