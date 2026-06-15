using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("WashGradingProcesses")]
public class WashGradingProcess : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int ProductId { get; set; }

    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;

    [Column(TypeName = "decimal(18,4)")]
    public decimal Weight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeightAfter { get; set; }

    public int? WashGradingWorkerId { get; set; }

    [ForeignKey("WashGradingWorkerId")]
    public WashGradingWorker? WashGradingWorker { get; set; }

    public ICollection<WashGradingRecord> WashGradingRecords { get; set; } = new List<WashGradingRecord>();

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }
}
