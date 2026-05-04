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

    // Remaining counts per category
    public int RemRedCount { get; set; }
    public int RemWhiteCount { get; set; }
    public int RemSpecialCount { get; set; }
    public int RemNaturalCount { get; set; }
    public int RemNaturalWhiteCount { get; set; }
    public int RemNaturalRedCount { get; set; }
    public int RemShortCutCount { get; set; }
    public int RemArtificialCount { get; set; }
    public int RemShortCount { get; set; }

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
