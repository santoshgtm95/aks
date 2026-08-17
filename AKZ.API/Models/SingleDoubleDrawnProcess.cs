using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SingleDoubleDrawnProcesses")]
public class SingleDoubleDrawnProcess : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int RefinementRecordId { get; set; }

    [ForeignKey("RefinementRecordId")]
    public RefinementRecord RefinementRecord { get; set; } = null!;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,4)")]
    public decimal Weight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }

    public int? WorkerId { get; set; }

    [ForeignKey("WorkerId")]
    public Worker? Worker { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }

    public ICollection<SingleDoubleDrawnRecord> SingleDoubleDrawnRecords { get; set; } = new List<SingleDoubleDrawnRecord>();
}
