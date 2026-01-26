using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("Sales")]
public class Sale
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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
