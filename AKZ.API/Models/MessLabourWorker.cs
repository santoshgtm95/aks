using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("MessLabourWorkers")]
public class MessLabourWorker : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int WarehouseId { get; set; }

    [ForeignKey("WarehouseId")]
    public Warehouse Warehouse { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}