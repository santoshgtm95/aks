namespace AKZ.API.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string Packages { get; set; } = string.Empty;
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal RemainingWeight { get; set; }
    public bool IsActive { get; set; }
    public int? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public bool IsUsed { get; set; }
}

public class CreateProductDto
{
    public DateTime Date { get; set; }
    public string Packages { get; set; } = string.Empty;
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "MMK";
    public int? WarehouseId { get; set; }
}

public class UpdateProductDto
{
    public DateTime Date { get; set; }
    public string Packages { get; set; } = string.Empty;
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal? RemainingWeight { get; set; }
    public int? WarehouseId { get; set; }
}
