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
public class WarehousesController : ControllerBase
{
    private readonly AKZDbContext _context;

    public WarehousesController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<WarehouseDto>>> GetWarehouses()
    {
        var warehouses = await _context.Warehouses
            .OrderBy(w => w.Name)
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Name = w.Name,
                Location = w.Location,
                IsActive = w.IsActive
            })
            .ToListAsync();

        return Ok(warehouses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WarehouseDto>> GetWarehouse(int id)
    {
        var warehouse = await _context.Warehouses
            .Where(w => w.Id == id)
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Name = w.Name,
                Location = w.Location,
                IsActive = w.IsActive
            })
            .FirstOrDefaultAsync();

        if (warehouse == null)
        {
            return NotFound();
        }

        return Ok(warehouse);
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseDto>> CreateWarehouse([FromBody] CreateWarehouseDto dto)
    {
        var warehouse = new Warehouse
        {
            Name = dto.Name,
            Location = dto.Location,
            IsActive = true
        };

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        var warehouseDto = new WarehouseDto
        {
            Id = warehouse.Id,
            Name = warehouse.Name,
            Location = warehouse.Location,
            IsActive = warehouse.IsActive
        };

        return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouseDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseDto dto)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);

        if (warehouse == null)
        {
            return NotFound();
        }

        warehouse.Name = dto.Name;
        warehouse.Location = dto.Location;
        warehouse.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWarehouse(int id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);

        if (warehouse == null)
        {
            return NotFound();
        }

        // Check if there are products in this warehouse
        var hasProducts = await _context.Products.AnyAsync(p => p.WarehouseId == id);
        if (hasProducts)
        {
            return BadRequest("Cannot delete a warehouse that contains products. Please move or delete the products first.");
        }

        _context.Warehouses.Remove(warehouse); // Since we have soft delete in DbContext, this will be handled there
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
