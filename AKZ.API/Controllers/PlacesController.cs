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
public class PlacesController : ControllerBase
{
    private readonly AKZDbContext _context;

    public PlacesController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlaceDto>>> GetPlaces()
    {
        return await _context.Places
            .Include(p => p.Warehouse)
            .Select(p => new PlaceDto
            {
                Id = p.Id,
                Name = p.Name,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse.Name,
                SupervisorName = p.SupervisorName
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<PlaceDto>> CreatePlace([FromBody] CreatePlaceDto dto)
    {
        var place = new Place
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId,
            SupervisorName = dto.SupervisorName
        };

        _context.Places.Add(place);
        await _context.SaveChangesAsync();

        await _context.Entry(place).Reference(p => p.Warehouse).LoadAsync();

        return Ok(new PlaceDto
        {
            Id = place.Id,
            Name = place.Name,
            WarehouseId = place.WarehouseId,
            WarehouseName = place.Warehouse.Name,
            SupervisorName = place.SupervisorName
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlace(int id, [FromBody] UpdatePlaceDto dto)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null) return NotFound();

        place.Name = dto.Name;
        place.WarehouseId = dto.WarehouseId;
        place.SupervisorName = dto.SupervisorName;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlace(int id)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null) return NotFound();

        _context.Places.Remove(place);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}