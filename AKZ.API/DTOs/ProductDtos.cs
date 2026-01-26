namespace AKZ.API.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int Packages { get; set; }
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal RemainingWeight { get; set; }
    public bool IsActive { get; set; }
}

public class CreateProductDto
{
    public DateTime Date { get; set; }
    public int Packages { get; set; }
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "MMK";
}

public class UpdateProductDto
{
    public DateTime Date { get; set; }
    public int Packages { get; set; }
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
}
