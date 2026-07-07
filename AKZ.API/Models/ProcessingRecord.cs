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

    public int? WashGradingRecordId { get; set; }

    [ForeignKey("WashGradingRecordId")]
    public WashGradingRecord? WashGradingRecord { get; set; }

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
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RegularWeight { get; set; }
    public double RegularCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal BlackWeight { get; set; }
    public double BlackCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RegularExtraWeight { get; set; }
    public double RegularExtraCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal BlackExtraWeight { get; set; }
    public double BlackExtraCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal WhiteExtraWeight { get; set; }
    public double WhiteExtraCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NaturalWhiteExtraWeight { get; set; }
    public double NaturalWhiteExtraCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal OffCutsWeight { get; set; }
    public double OffCutsCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReclaimedWeight { get; set; }
    public double ReclaimedCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal FluffWeight { get; set; }
    public double FluffCount { get; set; }

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
    public double RemNaturalCount { get; set; }
    public double RemNaturalWhiteCount { get; set; }
    public double RemArtificialCount { get; set; }
    public double RemRegularCount { get; set; }
    public double RemBlackCount { get; set; }
    public double RemRegularExtraCount { get; set; }
    public double RemBlackExtraCount { get; set; }
    public double RemWhiteExtraCount { get; set; }
    public double RemNaturalWhiteExtraCount { get; set; }
    public double RemOffCutsCount { get; set; }
    public double RemReclaimedCount { get; set; }
    public double RemFluffCount { get; set; }

    // Remaining weights per category
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemRedWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemWhiteWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalWhiteWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemArtificialWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemRegularWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemBlackWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemRegularExtraWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemBlackExtraWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemWhiteExtraWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemNaturalWhiteExtraWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemOffCutsWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemReclaimedWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemFluffWeight { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; } // Kept for aggregate/historical compatibility, or we sum it up

    public ICollection<ProcessingRecordWorker> Workers { get; set; } = new List<ProcessingRecordWorker>();
}
