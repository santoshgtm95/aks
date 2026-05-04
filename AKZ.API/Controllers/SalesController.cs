using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SalesController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SaleDto>>> GetSales([FromQuery] string? category = null)
    {
        var query = _context.Sales.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(s => s.Category == category);
        }

        var sales = await query
            .Include(s => s.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(s => s.Seller)
            .OrderByDescending(s => s.Date)
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
                Category = s.Category,
                WarehouseName = s.Product.Warehouse != null ? s.Product.Warehouse.Name : ""
            })
            .ToListAsync();

        return Ok(sales);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SaleDto>> GetSale(int id)
    {
        var sale = await _context.Sales
            .Include(s => s.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(s => s.Seller)
            .Where(s => s.Id == id)
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
                Category = s.Category,
                WarehouseName = s.Product.Warehouse != null ? s.Product.Warehouse.Name : ""
            })
            .FirstOrDefaultAsync();

        if (sale == null)
        {
            return NotFound();
        }

        return Ok(sale);
    }

    [HttpPost]
    public async Task<ActionResult<SaleDto>> CreateSale([FromBody] CreateSaleDto dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

        // Check if product exists and has enough stock
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return BadRequest(new { message = "Product not found" });
        }

        if (product.RemainingWeight < dto.Weight)
        {
            return BadRequest(new { message = "Insufficient stock" });
        }

        var sale = new Sale
        {
            Date = dto.Date,
            ProductId = dto.ProductId,
            Marker = dto.Marker,
            Unit = dto.Unit,
            Weight = dto.Weight,
            Price = dto.Price,
            Currency = dto.Currency,
            SellerId = userId,
            TotalRemaining = product.RemainingWeight - dto.Weight,
            Category = dto.Category
        };

        // Update product remaining weight
        product.RemainingWeight -= dto.Weight;

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        // Reload to get navigation properties
        await _context.Entry(sale).Reference(s => s.Product).LoadAsync();
        await _context.Entry(sale.Product).Reference(p => p.Warehouse).LoadAsync();
        await _context.Entry(sale).Reference(s => s.Seller).LoadAsync();

        var saleDto = new SaleDto
        {
            Id = sale.Id,
            Date = sale.Date,
            ProductId = sale.ProductId,
            ProductMarker = sale.Product.Marker,
            Marker = sale.Marker,
            Unit = sale.Unit,
            Weight = sale.Weight,
            Price = sale.Price,
            Currency = sale.Currency,
            SellerId = sale.SellerId,
            SellerName = sale.Seller.FullName,
            TotalRemaining = sale.TotalRemaining,
            Category = sale.Category,
            WarehouseName = sale.Product.Warehouse != null ? sale.Product.Warehouse.Name : ""
        };

        return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, saleDto);
    }
}
