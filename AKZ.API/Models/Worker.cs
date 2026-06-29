using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("Workers")]
public class Worker : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; } = true;

    public bool AssignWashGrading { get; set; } = false;
    public bool AssignMessLabour { get; set; } = false;
    public bool AssignGirdleBush { get; set; } = false;
    public bool AssignSingleDoubleDrawn { get; set; } = false;
    public bool AssignSemiExportPurchase { get; set; } = false;

    public int? WarehouseId { get; set; }

    [ForeignKey("WarehouseId")]
    public Warehouse? Warehouse { get; set; }

    public string? WarehouseName { get; set; }
}
