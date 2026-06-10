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
public class MessLabourWorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public MessLabourWorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<MessLabourWorkerDto>>> GetMessLabourWorkers()
    {
        return await _context.MessLabourWorkers
            .Include(mw => mw.Warehouse)
            .Select(mw => new MessLabourWorkerDto
            {
                Id = mw.Id,
                Name = mw.Name,
                WarehouseId = mw.WarehouseId,
                WarehouseName = mw.Warehouse.Name,
                IsActive = mw.IsActive
            })
            .ToListAsync();
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<ActionResult<List<MessLabourWorkerDto>>> GetMessLabourWorkersByWarehouse(int warehouseId)
    {
        return await _context.MessLabourWorkers
            .Include(mw => mw.Warehouse)
            .Where(mw => mw.WarehouseId == warehouseId && mw.IsActive)
            .Select(mw => new MessLabourWorkerDto
            {
                Id = mw.Id,
                Name = mw.Name,
                WarehouseId = mw.WarehouseId,
                WarehouseName = mw.Warehouse.Name,
                IsActive = mw.IsActive
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<MessLabourWorkerDto>> CreateMessLabourWorker([FromBody] CreateMessLabourWorkerDto dto)
    {
        var worker = new MessLabourWorker
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId,
            IsActive = true
        };

        _context.MessLabourWorkers.Add(worker);
        await _context.SaveChangesAsync();

        await _context.Entry(worker).Reference(mw => mw.Warehouse).LoadAsync();

        return Ok(new MessLabourWorkerDto
        {
            Id = worker.Id,
            Name = worker.Name,
            WarehouseId = worker.WarehouseId,
            WarehouseName = worker.Warehouse.Name,
            IsActive = worker.IsActive
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMessLabourWorker(int id, [FromBody] UpdateMessLabourWorkerDto dto)
    {
        var worker = await _context.MessLabourWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        worker.Name = dto.Name;
        worker.WarehouseId = dto.WarehouseId;
        worker.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessLabourWorker(int id)
    {
        var worker = await _context.MessLabourWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        _context.MessLabourWorkers.Remove(worker);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}