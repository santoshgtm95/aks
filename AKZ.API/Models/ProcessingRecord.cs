using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("ProcessingRecords")]
public class ProcessingRecord : BaseEntity
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
    public int RemainingCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RedWeight { get; set; }
    public int RedCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal WhiteWeight { get; set; }
    public int WhiteCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpecialWeight { get; set; }
    public int SpecialCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWeight { get; set; }
    public int NaturalCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWhiteWeight { get; set; }
    public int NaturalWhiteCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalRedWeight { get; set; }
    public int NaturalRedCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShortCutWeight { get; set; }
    public int ShortCutCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ArtificialWeight { get; set; }
    public int ArtificialCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShortWeight { get; set; }
    public int ShortCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LossWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? RemainingWeightKg { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Difference { get; set; }
}
