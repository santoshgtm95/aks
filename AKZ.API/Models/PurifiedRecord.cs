using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("PurifiedRecords")]
public class PurifiedRecord : BaseEntity
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

    public double Count { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Weight { get; set; }

    public int? PlaceId { get; set; }

    [ForeignKey("PlaceId")]
    public Place? Place { get; set; }

    public int? PurifierId { get; set; }
    [ForeignKey("PurifierId")]
    public Purifier? Purifier { get; set; }

    public bool IsWeightFull { get; set; } = true;
    
    public int? PurificationProcessId { get; set; }
    
    [ForeignKey("PurificationProcessId")]
    public PurificationProcess? PurificationProcess { get; set; }

    // Remaining stock of purified hair for further processing (Refinement, etc.)
    public double RemainingCount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingWeight { get; set; }
}
