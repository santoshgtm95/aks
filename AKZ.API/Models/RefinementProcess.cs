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

    public int Count { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Weight { get; set; }

    public int RemainingCountAfter { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeightAfter { get; set; }

    public int? PurifierId { get; set; }

    [ForeignKey("PurifierId")]
    public Purifier? Purifier { get; set; }

    public ICollection<RefinementRecord> RefinementRecords { get; set; } = new List<RefinementRecord>();
}
