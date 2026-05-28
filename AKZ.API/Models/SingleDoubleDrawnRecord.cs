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
}
