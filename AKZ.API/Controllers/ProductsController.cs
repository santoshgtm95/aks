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
public class ProductsController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ProductsController(AKZDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetProducts([FromQuery] bool all = false)
    {
        var warehouseId = GetCurrentUserWarehouseId();
        var query = _context.Products.AsQueryable();

        if (!all)
            query = query.Where(p => p.IsActive);

        if (warehouseId.HasValue)
            query = query.Where(p => p.WarehouseId == warehouseId);

        var products = await query
            .OrderByDescending(p => p.Date)
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
                IsActive = p.IsActive,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse != null ? p.Warehouse.Name : null
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _context.Products
            .Where(p => p.Id == id)
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
                IsActive = p.IsActive,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse != null ? p.Warehouse.Name : null
            })
            .FirstOrDefaultAsync();

        if (product == null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        var product = new Product
        {
            Date = dto.Date,
            Packages = dto.Packages,
            Marker = dto.Marker,
            Unit = dto.Unit,
            Weight = dto.Weight,
            Price = dto.Price,
            Currency = dto.Currency,
            RemainingWeight = dto.Weight,
            IsActive = true,
            WarehouseId = dto.WarehouseId
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var productDto = new ProductDto
        {
            Id = product.Id,
            Date = product.Date,
            Packages = product.Packages,
            Marker = product.Marker,
            Unit = product.Unit,
            Weight = product.Weight,
            Price = product.Price,
            Currency = product.Currency,
            RemainingWeight = product.RemainingWeight,
            IsActive = product.IsActive,
            WarehouseId = product.WarehouseId
        };

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);

        if (product == null)
        {
            return NotFound();
        }

        product.Date = dto.Date;
        product.Packages = dto.Packages;
        product.Marker = dto.Marker;
        product.Unit = dto.Unit;
        product.Weight = dto.Weight;
        product.Price = dto.Price;
        product.Currency = dto.Currency;
        product.WarehouseId = dto.WarehouseId;
        
        if (dto.RemainingWeight.HasValue)
        {
            product.RemainingWeight = dto.RemainingWeight.Value;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);

        if (product == null)
        {
            return NotFound();
        }

        product.IsActive = false;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
