using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.Models;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public WorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Worker>>> GetWorkers()
    {
        return await _context.Workers
            .Where(w => w.IsActive)
            .OrderBy(w => w.Name)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Worker>> CreateWorker([FromBody] Worker worker)
    {
        if (worker.WarehouseId.HasValue)
        {
            var warehouse = await _context.Warehouses.FindAsync(worker.WarehouseId.Value);
            if (warehouse != null)
            {
                worker.WarehouseName = warehouse.Name;
            }
        }
        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();
        return Ok(worker);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateWorker(int id, [FromBody] Worker worker)
    {
        var existing = await _context.Workers.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.Name = worker.Name;
        existing.PhoneNumber = worker.PhoneNumber;
        existing.IsActive = worker.IsActive;
        existing.AssignWashGrading = worker.AssignWashGrading;
        existing.AssignMessLabour = worker.AssignMessLabour;
        existing.AssignGirdleBush = worker.AssignGirdleBush;
        existing.AssignSingleDoubleDrawn = worker.AssignSingleDoubleDrawn;
        existing.AssignSemiExportPurchase = worker.AssignSemiExportPurchase;
        existing.WarehouseId = worker.WarehouseId;
        
        if (worker.WarehouseId.HasValue)
        {
            var warehouse = await _context.Warehouses.FindAsync(worker.WarehouseId.Value);
            existing.WarehouseName = warehouse?.Name;
        }
        else
        {
            existing.WarehouseName = null;
        }

        existing.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteWorker(int id)
    {
        var existing = await _context.Workers.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.IsActive = false;
        existing.DeleteFlg = 1;
        existing.DeleteDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
