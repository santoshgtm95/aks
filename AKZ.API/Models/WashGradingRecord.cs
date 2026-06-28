using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("WashGradingRecords")]
public class WashGradingRecord : BaseEntity
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
    public decimal LostWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }

    public int? WashGradingWorkerId { get; set; }

    [ForeignKey("WashGradingWorkerId")]
    public Worker? Worker { get; set; }

    public int? WashGradingProcessId { get; set; }

    [ForeignKey("WashGradingProcessId")]
    public WashGradingProcess? WashGradingProcess { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }
}
