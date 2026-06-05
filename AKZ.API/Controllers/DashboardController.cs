using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AKZDbContext _context;

    public DashboardController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var today = DateTime.UtcNow.Date;

        var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
        var activeProducts = await _context.Products.CountAsync(p => p.IsActive && p.RemainingWeight > 0);
        var totalInventoryWeight = await _context.Products
            .Where(p => p.IsActive)
            .SumAsync(p => p.RemainingWeight);

        var totalSales = await _context.Sales.CountAsync();
        var totalSalesAmount = await _context.Sales.SumAsync(s => s.Price * s.Weight);

        var todaySales = await _context.Sales.CountAsync(s => s.Date.Date == today);
        var todaySalesAmount = await _context.Sales
            .Where(s => s.Date.Date == today)
            .SumAsync(s => s.Price * s.Weight);

        var recentSales = await _context.Sales
            .Include(s => s.Product)
            .Include(s => s.Seller)
            .OrderByDescending(s => s.Date)
            .Take(10)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                Date = s.Date,
                ProductId = s.ProductId,
                ProductMarker = s.Product.Marker,
                Marker = s.Marker,
                Unit = s.Unit,
                Weight = s.Weight,
                Price = s.Price,
                Currency = s.Currency,
                SellerId = s.SellerId,
                SellerName = s.Seller.FullName,
                TotalRemaining = s.TotalRemaining,
                Category = s.Category
            })
            .ToListAsync();

        var lowStockProducts = await _context.Products
            .Where(p => p.IsActive && p.RemainingWeight < (p.Weight * 0.2m))
            .OrderBy(p => p.RemainingWeight)
            .Take(10)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Date = p.Date,
                Packages = p.Packages,
                Marker = p.Marker,
                Unit = p.Unit,
                Weight = p.Weight,
                Price = p.Price,
                Currency = p.Currency,
                RemainingWeight = p.RemainingWeight,
                IsActive = p.IsActive
            })
            .ToListAsync();

        // Per-marker sorting stats from SingleDoubleDrawnRecords
        var sddRecords = await _context.SingleDoubleDrawnRecords
            .Include(s => s.RefinementRecord)
                .ThenInclude(rr => rr.PurifiedRecord)
                    .ThenInclude(p => p.ProcessingRecord)
                        .ThenInclude(pr => pr.Product)
                            .ThenInclude(prod => prod.Warehouse)
            .ToListAsync();

        var markerStats = sddRecords
            .GroupBy(s =>
            {
                var marker = s.RefinementRecord?.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "---";
                return marker;
            })
            .Select(g =>
            {
                var first = g.First();
                var warehouseName = first.RefinementRecord?.PurifiedRecord?.ProcessingRecord?.Product?.Warehouse?.Name ?? "";
                var category = first.RefinementRecord?.Category ?? "";

                var totalSorted =
                    g.Sum(r => r.Size6 + r.Size7 + r.Size8 + r.Size9 + r.Size10 +
                               r.Size10B + r.Size12 + r.Size14 + r.Size16 + r.Size18 +
                               r.Size20 + r.Size22 + r.Size24 + r.Size26 + r.Size28 + r.SizeBar);

                var totalLost = g.Sum(r => r.LostWeight);
                var totalSpoilage = g.Sum(r => r.SpoilageWeight + r.SpoilageSize);
                var totalReturns = g.Sum(r => r.ReturnWeight + r.ReturnSize);

                return new MarkerSortingStatsDto
                {
                    Marker = g.Key,
                    WarehouseName = warehouseName,
                    Category = category,
                    TotalSorted = totalSorted,
                    TotalLost = totalLost,
                    TotalSpoilage = totalSpoilage,
                    TotalReturns = totalReturns,
                    RecordCount = g.Count()
                };
            })
            .OrderByDescending(m => m.TotalSorted)
            .ToList();

        var stats = new DashboardStatsDto
        {
            TotalProducts = totalProducts,
            ActiveProducts = activeProducts,
            TotalInventoryWeight = totalInventoryWeight,
            TotalSales = totalSales,
            TotalSalesAmount = totalSalesAmount,
            TodaySales = todaySales,
            TodaySalesAmount = todaySalesAmount,
            RecentSales = recentSales,
            LowStockProducts = lowStockProducts,
            MarkerSortingStats = markerStats
        };

        return Ok(stats);
    }
}
