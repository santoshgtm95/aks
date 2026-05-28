using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("RefinementRecords")]
public class RefinementRecord : BaseEntity
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

    public int? PurifierId { get; set; }

    [ForeignKey("PurifierId")]
    public Purifier? Purifier { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LostWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilageWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnWeight { get; set; }

    public int? RefinementProcessId { get; set; }

    [ForeignKey("RefinementProcessId")]
    public RefinementProcess? RefinementProcess { get; set; }

    // Remaining stock after this record for further downstream use
    public int RemainingCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }
}
