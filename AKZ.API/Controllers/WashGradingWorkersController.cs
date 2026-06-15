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
public class WashGradingWorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public WashGradingWorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<WashGradingWorkerDto>>> GetWashGradingWorkers()
    {
        return await _context.WashGradingWorkers
            .Include(rw => rw.Warehouse)
            .Select(rw => new WashGradingWorkerDto
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
    public async Task<ActionResult<List<WashGradingWorkerDto>>> GetWashGradingWorkersByWarehouse(int warehouseId)
    {
        return await _context.WashGradingWorkers
            .Include(rw => rw.Warehouse)
            .Where(rw => rw.WarehouseId == warehouseId && rw.IsActive)
            .Select(rw => new WashGradingWorkerDto
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
    public async Task<ActionResult<WashGradingWorkerDto>> CreateWashGradingWorker([FromBody] CreateWashGradingWorkerDto dto)
    {
        var worker = new WashGradingWorker
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId,
            IsActive = true
        };

        _context.WashGradingWorkers.Add(worker);
        await _context.SaveChangesAsync();

        await _context.Entry(worker).Reference(rw => rw.Warehouse).LoadAsync();

        return Ok(new WashGradingWorkerDto
        {
            Id = worker.Id,
            Name = worker.Name,
            WarehouseId = worker.WarehouseId,
            WarehouseName = worker.Warehouse.Name,
            IsActive = worker.IsActive
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWashGradingWorker(int id, [FromBody] UpdateWashGradingWorkerDto dto)
    {
        var worker = await _context.WashGradingWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        worker.Name = dto.Name;
        worker.WarehouseId = dto.WarehouseId;
        worker.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWashGradingWorker(int id)
    {
        var worker = await _context.WashGradingWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        _context.WashGradingWorkers.Remove(worker);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
