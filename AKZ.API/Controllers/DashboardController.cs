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
            LowStockProducts = lowStockProducts
        };

        return Ok(stats);
    }
}
