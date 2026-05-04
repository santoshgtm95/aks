using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("Products")]
public class Product : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [MaxLength(100)]
    public string Packages { get; set; } = string.Empty;

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

    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingWeight { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey("Warehouse")]
    public int? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    // Navigation properties
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
