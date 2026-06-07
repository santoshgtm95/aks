using System.ComponentModel.DataAnnotations;

namespace AKZ.API.DTOs;

public class SingleDoubleDrawnWorkerReturnDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

public class SingleDoubleDrawnWorkerCreateDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int WarehouseId { get; set; }
}

public class SingleDoubleDrawnWorkerUpdateDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int WarehouseId { get; set; }
}