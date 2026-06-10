using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("PurificationWorkers")]
public class PurificationWorker : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int PurifiedRecordId { get; set; }
    [ForeignKey("PurifiedRecordId")]
    public PurifiedRecord? PurifiedRecord { get; set; }

    public int PlaceId { get; set; }
    [ForeignKey("PlaceId")]
    public Place? Place { get; set; }

    public int PurifierId { get; set; }
    [ForeignKey("PurifierId")]
    public Purifier? Purifier { get; set; }

    public double Count { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal WorkerFees { get; set; }
}
