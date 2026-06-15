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
    public string? CustomerName { get; set; }
    public string? CustomerContact { get; set; }
    public string? Remark { get; set; }
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
    public string? CustomerName { get; set; }
    public string? CustomerContact { get; set; }
    public string? Remark { get; set; }
}

public class MarkerSortingStatsDto
{
    public string Marker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal TotalSorted { get; set; }
    public decimal TotalLost { get; set; }
    public decimal TotalSpoilage { get; set; }
    public decimal TotalReturns { get; set; }
    public int RecordCount { get; set; }
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
    public List<MarkerSortingStatsDto> MarkerSortingStats { get; set; } = new();
}
