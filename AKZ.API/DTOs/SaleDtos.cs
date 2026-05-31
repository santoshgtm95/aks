namespace AKZ.API.DTOs;

public class SaleDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }

    public decimal PlusMinusWeight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public decimal TotalRemaining { get; set; }
    public string Category { get; set; } = string.Empty;
}

public class CreateSaleDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string Marker { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Weight { get; set; }

    public decimal PlusMinusWeight { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "MMK";
    public string Category { get; set; } = "General";
}

public class DashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public decimal TotalInventoryWeight { get; set; }
    public int TotalSales { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public int TodaySales { get; set; }
    public decimal TodaySalesAmount { get; set; }
    public List<SaleDto> RecentSales { get; set; } = new();
    public List<ProductDto> LowStockProducts { get; set; } = new();
}
