using System.ComponentModel.DataAnnotations;

namespace AKZ.API.DTOs;

public class RefinementWorkerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateRefinementWorkerDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int WarehouseId { get; set; }
}

public class UpdateRefinementWorkerDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int WarehouseId { get; set; }

    public bool IsActive { get; set; }
}
