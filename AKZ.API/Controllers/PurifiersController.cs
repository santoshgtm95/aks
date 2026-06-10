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
public class PurifiersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public PurifiersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<PurifierDto>>> GetPurifiers()
    {
        return await _context.Purifiers
            .Include(p => p.Warehouse)
            .Include(p => p.Place)
            .Select(p => new PurifierDto
            {
                Id = p.Id,
                Name = p.Name,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse.Name,
                PlaceId = p.PlaceId,
                PlaceName = p.Place != null ? p.Place.Name : null,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<ActionResult<List<PurifierDto>>> GetPurifiersByWarehouse(int warehouseId)
    {
        return await _context.Purifiers
            .Include(p => p.Warehouse)
            .Include(p => p.Place)
            .Where(p => p.WarehouseId == warehouseId && p.IsActive)
            .Select(p => new PurifierDto
            {
                Id = p.Id,
                Name = p.Name,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse.Name,
                PlaceId = p.PlaceId,
                PlaceName = p.Place != null ? p.Place.Name : null,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<PurifierDto>> CreatePurifier([FromBody] CreatePurifierDto dto)
    {
        var purifier = new Purifier
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId,
            PlaceId = dto.PlaceId,
            IsActive = true
        };

        _context.Purifiers.Add(purifier);
        await _context.SaveChangesAsync();

        await _context.Entry(purifier).Reference(p => p.Warehouse).LoadAsync();
        if (purifier.PlaceId.HasValue)
        {
            await _context.Entry(purifier).Reference(p => p.Place).LoadAsync();
        }

        return Ok(new PurifierDto
        {
            Id = purifier.Id,
            Name = purifier.Name,
            WarehouseId = purifier.WarehouseId,
            WarehouseName = purifier.Warehouse.Name,
            PlaceId = purifier.PlaceId,
            PlaceName = purifier.Place?.Name,
            IsActive = purifier.IsActive
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePurifier(int id, [FromBody] UpdatePurifierDto dto)
    {
        var purifier = await _context.Purifiers.FindAsync(id);
        if (purifier == null) return NotFound();

        purifier.Name = dto.Name;
        purifier.WarehouseId = dto.WarehouseId;
        purifier.PlaceId = dto.PlaceId;
        purifier.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePurifier(int id)
    {
        var purifier = await _context.Purifiers.FindAsync(id);
        if (purifier == null) return NotFound();

        _context.Purifiers.Remove(purifier);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
