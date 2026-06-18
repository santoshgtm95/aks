using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SemiExportPurchases")]
public class SemiExportPurchase : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Contact { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalReceiveWeight { get; set; }

    [Required]
    public DateTime ReceiveDateTime { get; set; }

    [Required]
    [MaxLength(100)]
    public string Color { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
