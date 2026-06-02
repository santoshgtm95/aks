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
public class RefinementWorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public RefinementWorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<RefinementWorkerDto>>> GetRefinementWorkers()
    {
        return await _context.RefinementWorkers
            .Include(rw => rw.Warehouse)
            .Select(rw => new RefinementWorkerDto
            {
                Id = rw.Id,
                Name = rw.Name,
                WarehouseId = rw.WarehouseId,
                WarehouseName = rw.Warehouse.Name,
                IsActive = rw.IsActive
            })
            .ToListAsync();
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<ActionResult<List<RefinementWorkerDto>>> GetRefinementWorkersByWarehouse(int warehouseId)
    {
        return await _context.RefinementWorkers
            .Include(rw => rw.Warehouse)
            .Where(rw => rw.WarehouseId == warehouseId && rw.IsActive)
            .Select(rw => new RefinementWorkerDto
            {
                Id = rw.Id,
                Name = rw.Name,
                WarehouseId = rw.WarehouseId,
                WarehouseName = rw.Warehouse.Name,
                IsActive = rw.IsActive
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<RefinementWorkerDto>> CreateRefinementWorker([FromBody] CreateRefinementWorkerDto dto)
    {
        var refinementWorker = new RefinementWorker
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId,
            IsActive = true
        };

        _context.RefinementWorkers.Add(refinementWorker);
        await _context.SaveChangesAsync();

        await _context.Entry(refinementWorker).Reference(rw => rw.Warehouse).LoadAsync();

        return Ok(new RefinementWorkerDto
        {
            Id = refinementWorker.Id,
            Name = refinementWorker.Name,
            WarehouseId = refinementWorker.WarehouseId,
            WarehouseName = refinementWorker.Warehouse.Name,
            IsActive = refinementWorker.IsActive
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRefinementWorker(int id, [FromBody] UpdateRefinementWorkerDto dto)
    {
        var refinementWorker = await _context.RefinementWorkers.FindAsync(id);
        if (refinementWorker == null) return NotFound();

        refinementWorker.Name = dto.Name;
        refinementWorker.WarehouseId = dto.WarehouseId;
        refinementWorker.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRefinementWorker(int id)
    {
        var refinementWorker = await _context.RefinementWorkers.FindAsync(id);
        if (refinementWorker == null) return NotFound();

        _context.RefinementWorkers.Remove(refinementWorker);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}