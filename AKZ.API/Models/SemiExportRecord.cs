using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SemiExportRecords")]
public class SemiExportRecord : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int SingleDoubleDrawnRecordId { get; set; }

    [ForeignKey("SingleDoubleDrawnRecordId")]
    public SingleDoubleDrawnRecord SingleDoubleDrawnRecord { get; set; } = null!;

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceB { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price28 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price26 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price24 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price22 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price20 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price18 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price16 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price14 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price12 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price10B { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price10 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price9 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price8 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price7 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price6 { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceLeftover { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PriceSpoil { get; set; }

    [MaxLength(500)]
    public string Remark { get; set; } = string.Empty;
}
