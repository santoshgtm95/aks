using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("RefiningProcesses")]
public class RefiningProcess : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int PurifiedRecordId { get; set; }

    [ForeignKey("PurifiedRecordId")]
    public PurifiedRecord PurifiedRecord { get; set; } = null!;

    [Required]
    public string Category { get; set; } = string.Empty;

    public double Count { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Weight { get; set; }

    public int? RefinementWorkerId { get; set; }

    [ForeignKey("RefinementWorkerId")]
    public Worker? Worker { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LostWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilageWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnWeight { get; set; }

    public int? RefinementProcessId { get; set; }

    [ForeignKey("RefinementProcessId")]
    public RefinementProcess? RefinementProcess { get; set; }

    public double RemainingCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }

    public ICollection<RefinementRecord> RefinementRecords { get; set; } = new List<RefinementRecord>();
}
