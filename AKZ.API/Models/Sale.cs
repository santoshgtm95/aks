using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("Sales")]
public class Sale : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int ProductId { get; set; }

    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Marker { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string Unit { get; set; } = string.Empty; // kg or viss

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Weight { get; set; }

    // Plus/Minus weight for adjustment
    [Column(TypeName = "decimal(18,2)")]
    public decimal PlusMinusWeight { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "MMK"; // CNY, MMK, INR

    public int SellerId { get; set; }

    [ForeignKey("SellerId")]
    public User Seller { get; set; } = null!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRemaining { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "General";

    [MaxLength(255)]
    public string? CustomerName { get; set; }

    [MaxLength(50)]
    public string? CustomerContact { get; set; }

    [MaxLength(1000)]
    public string? Remark { get; set; }
}
