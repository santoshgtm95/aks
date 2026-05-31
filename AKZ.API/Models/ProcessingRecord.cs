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

    public double Count { get; set; }
    public double RemainingCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RedWeight { get; set; }
    public double RedCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal WhiteWeight { get; set; }
    public double WhiteCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpecialWeight { get; set; }
    public double SpecialCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalRedWeight { get; set; }
    public double NaturalRedCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShortCutWeight { get; set; }
    public double ShortCutCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShortWeight { get; set; }
    public double ShortCount { get; set; }

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

    // Remaining counts per category
    public double RemRedCount { get; set; }
    public double RemWhiteCount { get; set; }
    public double RemSpecialCount { get; set; }
    public double RemNaturalCount { get; set; }
    public double RemNaturalWhiteCount { get; set; }
    public double RemNaturalRedCount { get; set; }
    public double RemShortCutCount { get; set; }
    public double RemArtificialCount { get; set; }
    public double RemShortCount { get; set; }

    // Remaining weights per category
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemRedWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemWhiteWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemSpecialWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalWhiteWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalRedWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemShortCutWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemArtificialWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemShortWeight { get; set; }
}
