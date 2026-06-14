using System.ComponentModel.DataAnnotations;

namespace AKZ.API.DTOs;

public class PlaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SupervisorName { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

public class CreatePlaceDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? SupervisorName { get; set; }

    [Required]
    public int WarehouseId { get; set; }
}

public class UpdatePlaceDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? SupervisorName { get; set; }

    [Required]
    public int WarehouseId { get; set; }
}