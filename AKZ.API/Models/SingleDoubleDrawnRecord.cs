using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SingleDoubleDrawnRecords")]
public class SingleDoubleDrawnRecord : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int RefinementRecordId { get; set; }

    [ForeignKey("RefinementRecordId")]
    public RefinementRecord RefinementRecord { get; set; } = null!;

    // Two Inches Category (5 sizes)
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size6 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size7 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size8 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size9 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10 { get; set; }

    // B to Ten Category (11 sizes)
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10B { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size12 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size14 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size16 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size18 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size20 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size22 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size24 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size26 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size28 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SizeBar { get; set; }

    // Weight tracking
    [Column(TypeName = "decimal(18,4)")]
    public decimal LostWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilageWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SingleDoubleLostWeight { get; set; }

    public int? WorkerId { get; set; }

    [ForeignKey("WorkerId")]
    public Worker? Worker { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    // Pricing for each size
    [Column(TypeName = "decimal(18,4)")]
    public decimal Price6 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price7 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price8 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price9 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price10 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price10B { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price12 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price14 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price16 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price18 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price20 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price22 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price24 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price26 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price28 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceBar { get; set; }

    // Two Inches Category - Spoilage and Return sizes
    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilageSize { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnSize { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceSpoilageSize { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceReturnSize { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }
}
