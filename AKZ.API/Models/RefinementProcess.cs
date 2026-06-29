using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("RefinementProcesses")]
public class RefinementProcess : BaseEntity
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

    public double RemainingCountAfter { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeightAfter { get; set; }

    public int? RefinementWorkerId { get; set; }

    [ForeignKey("RefinementWorkerId")]
    public Worker? Worker { get; set; }

    public ICollection<RefinementRecord> RefinementRecords { get; set; } = new List<RefinementRecord>();

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }
}
