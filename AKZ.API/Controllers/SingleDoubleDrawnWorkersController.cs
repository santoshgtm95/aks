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
public class SingleDoubleDrawnWorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SingleDoubleDrawnWorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SingleDoubleDrawnWorkerReturnDto>>> GetWorkers()
    {
        return await _context.SingleDoubleDrawnWorkers
            .Include(p => p.Warehouse)
            .Select(p => new SingleDoubleDrawnWorkerReturnDto
            {
                Id = p.Id,
                Name = p.Name,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse.Name
            })
            .ToListAsync();
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<ActionResult<List<SingleDoubleDrawnWorkerReturnDto>>> GetWorkersByWarehouse(int warehouseId)
    {
        return await _context.SingleDoubleDrawnWorkers
            .Include(p => p.Warehouse)
            .Where(p => p.WarehouseId == warehouseId)
            .Select(p => new SingleDoubleDrawnWorkerReturnDto
            {
                Id = p.Id,
                Name = p.Name,
                WarehouseId = p.WarehouseId,
                WarehouseName = p.Warehouse.Name
            })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SingleDoubleDrawnWorkerReturnDto>> CreateWorker(SingleDoubleDrawnWorkerCreateDto dto)
    {
        var worker = new SingleDoubleDrawnWorker
        {
            Name = dto.Name,
            WarehouseId = dto.WarehouseId
        };
        _context.SingleDoubleDrawnWorkers.Add(worker);
        await _context.SaveChangesAsync();

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);

        return Ok(new SingleDoubleDrawnWorkerReturnDto
        {
            Id = worker.Id,
            Name = worker.Name,
            WarehouseId = worker.WarehouseId,
            WarehouseName = warehouse?.Name ?? ""
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorker(int id, SingleDoubleDrawnWorkerUpdateDto dto)
    {
        var worker = await _context.SingleDoubleDrawnWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        worker.Name = dto.Name;
        worker.WarehouseId = dto.WarehouseId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorker(int id)
    {
        var worker = await _context.SingleDoubleDrawnWorkers.FindAsync(id);
        if (worker == null) return NotFound();

        _context.SingleDoubleDrawnWorkers.Remove(worker);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}