using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("ProcessingRecords")]
public class ProcessingRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int ProductId { get; set; }

    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;

    [Required]
    public string WorkerNames { get; set; } = string.Empty;

    public int Count { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RedWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal WhiteWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpecialWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShortWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LossWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Difference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
