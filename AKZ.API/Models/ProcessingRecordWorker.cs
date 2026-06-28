using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AKZ.API.Models;

[Table("ProcessingRecordWorkers")]
public class ProcessingRecordWorker
{
    [Key]
    public int Id { get; set; }

    public int ProcessingRecordId { get; set; }
    [ForeignKey("ProcessingRecordId")]
    [JsonIgnore]
    public ProcessingRecord ProcessingRecord { get; set; } = null!;

    public int MessLabourWorkerId { get; set; }
    [ForeignKey("MessLabourWorkerId")]
    public Worker Worker { get; set; } = null!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFee { get; set; }
}
