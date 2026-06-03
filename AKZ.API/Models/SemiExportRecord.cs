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

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }

    [MaxLength(500)]
    public string Remark { get; set; } = string.Empty;
}
