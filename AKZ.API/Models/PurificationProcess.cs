using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("PurificationProcesses")]
public class PurificationProcess : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public int ProcessingRecordId { get; set; }

    [ForeignKey("ProcessingRecordId")]
    public ProcessingRecord ProcessingRecord { get; set; } = null!;

    [Required]
    public string Category { get; set; } = string.Empty;

    public double PurifyCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PurifyWeight { get; set; }

    public double RemainingCountAfter { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeightAfter { get; set; }

    public int? PlaceId { get; set; }
    public bool IsWeightFull { get; set; } = true;

    [ForeignKey("PlaceId")]
    public Place? Place { get; set; }

    public ICollection<PurifiedRecord> PurifiedRecords { get; set; } = new List<PurifiedRecord>();

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }
}
