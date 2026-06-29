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
public class RefinementController : ControllerBase
{
    private readonly AKZDbContext _context;

    public RefinementController(AKZDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null;
        return int.TryParse(claim, out var id) ? id : null;
    }

    // GET /api/refinement/available-categories
    // Returns PurifiedRecords that still have remaining stock (not yet used in Refinement)
    [HttpGet("available-categories")]
    public async Task<ActionResult<List<AvailablePurifiedCategoryDto>>> GetAvailableCategories()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var purifiedRecords = await _context.PurifiedRecords
            .Include(p => p.ProcessingRecord)
                .ThenInclude(r => r.Product)
                    .ThenInclude(pr => pr.Warehouse)
            .Where(p => p.DeleteFlg == 0)
            .Where(p => warehouseId == null || p.ProcessingRecord.Product.WarehouseId == warehouseId)
            .OrderByDescending(p => p.Date)
            .ToListAsync();

        // Fetch all refinement processes to calculate actual remaining
        var usedHistory = await _context.RefinementProcesses
            .Where(r => r.DeleteFlg == 0)
            .ToListAsync();

        var result = new List<AvailablePurifiedCategoryDto>();

        foreach (var p in purifiedRecords)
        {
            if (p.ProcessingRecord?.Product == null) continue;

            // Calculate how much of this PurifiedRecord has already been used in Refinement
            var used = usedHistory
                .Where(h => h.PurifiedRecordId == p.Id)
                .Sum(h => h.Count);

            double actualRemaining = p.RemainingCount - used;
            if (actualRemaining <= 0) continue;

            decimal unitWeight = (decimal)p.Count > 0 ? p.Weight / (decimal)p.Count : 0;
            decimal remainingWeight = (decimal)actualRemaining * unitWeight;

            string warehouseName = p.ProcessingRecord.Product.Warehouse?.Name ?? "";
            if (string.IsNullOrEmpty(warehouseName) && p.ProcessingRecord.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(p.ProcessingRecord.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            result.Add(new AvailablePurifiedCategoryDto
            {
                PurifiedRecordId = p.Id,
                ProductMarker = p.ProcessingRecord.Product.Marker,
                WarehouseName = warehouseName,
                WarehouseId = p.ProcessingRecord.Product.WarehouseId,
                Category = p.Category,
                RemainingCount = actualRemaining,
                RemainingWeight = remainingWeight,
                UnitWeight = unitWeight
            });
        }

        return Ok(result);
    }

    // GET /api/refinement
    // Returns RefinementProcesses that still have unconsumed balance (for sidebar history tab)
    [HttpGet]
    public async Task<ActionResult<List<RefinementProcessDto>>> GetProcesses()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var processes = await _context.RefinementProcesses
            .Include(r => r.PurifiedRecord)
                .ThenInclude(p => p.ProcessingRecord)
                    .ThenInclude(pr => pr.Product)
                        .ThenInclude(prod => prod.Warehouse)
            .Include(r => r.Worker)
            .Include(r => r.RefinementRecords)
            .Where(r => r.DeleteFlg == 0)
            .Where(r => warehouseId == null || r.PurifiedRecord.ProcessingRecord.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<RefinementProcessDto>();

        foreach (var r in processes)
        {
            decimal totalAssigned = r.Weight;
            decimal totalConsumed = r.RefinementRecords
                .Where(rr => rr.DeleteFlg == 0)
                .Sum(rr => rr.Weight + rr.LostWeight + rr.SpoilageWeight + rr.ReturnWeight);

            decimal remainingWeight = totalAssigned - totalConsumed;
            if (remainingWeight <= 0.001m) continue;

            double usedCount = r.RefinementRecords.Where(rr => rr.DeleteFlg == 0).Sum(rr => rr.Count);
            double remainingCount = r.Count - usedCount;

            decimal usedWeight = r.RefinementRecords.Where(rr => rr.DeleteFlg == 0).Sum(rr => rr.Weight);

            string warehouseName = r.PurifiedRecord?.ProcessingRecord?.Product?.Warehouse?.Name ?? "";

            result.Add(new RefinementProcessDto
            {
                Id = r.Id,
                Date = r.Date,
                PurifiedRecordId = r.PurifiedRecordId,
                ProductMarker = r.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "",
                Category = r.Category,
                Count = remainingCount,
                Weight = remainingWeight,
                RemainingCountAfter = r.RemainingCountAfter,
                RemainingWeightAfter = r.RemainingWeightAfter,
                WarehouseName = warehouseName,
                RefinementWorkerId = r.RefinementWorkerId,
                RefinementWorkerName = r.Worker?.Name ?? "",
                WorkerFees = r.WorkerFees,
            });
        }

        return Ok(result);
    }

    // GET /api/refinement/refinement-records
    // Returns all RefinementRecords (completed Refinement stock)
    [HttpGet("refinement-records")]
    public async Task<ActionResult<List<RefinementRecordDto>>> GetRefinementRecords()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.RefinementRecords
            .Include(r => r.PurifiedRecord)
                .ThenInclude(p => p.ProcessingRecord)
                    .ThenInclude(pr => pr.Product)
                        .ThenInclude(prod => prod.Warehouse)
            .Include(r => r.Worker)
            .Where(r => r.DeleteFlg == 0)
            .Where(r => warehouseId == null || r.PurifiedRecord.ProcessingRecord.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<RefinementRecordDto>();

        foreach (var r in records)
        {
            if (r.PurifiedRecord?.ProcessingRecord?.Product == null) continue;

            string warehouseName = r.PurifiedRecord.ProcessingRecord.Product.Warehouse?.Name ?? "";
            if (string.IsNullOrEmpty(warehouseName) && r.PurifiedRecord.ProcessingRecord.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(r.PurifiedRecord.ProcessingRecord.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            result.Add(new RefinementRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                PurifiedRecordId = r.PurifiedRecordId,
                ProductMarker = r.PurifiedRecord.ProcessingRecord.Product.Marker,
                Category = r.Category,
                Count = r.Count,
                Weight = r.Weight,
                WarehouseName = warehouseName,
                RefinementWorkerId = r.RefinementWorkerId,
                RefinementWorkerName = r.Worker?.Name ?? "",
                LostWeight = r.LostWeight,
                SpoilageWeight = r.SpoilageWeight,
                ReturnWeight = r.ReturnWeight,
                WorkerFees = r.WorkerFees,
                IsLocked = _context.SingleDoubleDrawnRecords.Any(rr => rr.RefinementRecordId == r.Id && rr.DeleteFlg == 0)
            });
        }

        return Ok(result);
    }

    // POST /api/refinement
    // Creates a RefinementProcess and decrements PurifiedRecord.RemainingCount
    [HttpPost]
    public async Task<ActionResult<RefinementProcessDto>> CreateProcess([FromBody] CreateRefinementProcessDto dto)
    {
        var purifiedRecord = await _context.PurifiedRecords
            .Include(p => p.ProcessingRecord)
                .ThenInclude(r => r.Product)
                    .ThenInclude(pr => pr.Warehouse)
            .FirstOrDefaultAsync(p => p.Id == dto.PurifiedRecordId);

        if (purifiedRecord == null) return BadRequest(new { message = "Purified record not found" });

        // Check remaining
        var usedSoFar = await _context.RefinementProcesses
            .Where(r => r.PurifiedRecordId == dto.PurifiedRecordId && r.DeleteFlg == 0)
            .SumAsync(r => r.Count);

        decimal unitWeight = (decimal)purifiedRecord.Count > 0 ? purifiedRecord.Weight / (decimal)purifiedRecord.Count : 0;
        double count = unitWeight > 0 ? (double)(dto.Weight / unitWeight) : dto.Count;

        double actualRemaining = purifiedRecord.RemainingCount - usedSoFar;
        if (count > actualRemaining)
            return BadRequest(new { message = $"လက်ကျန် မလုံလောက်ပါ (ကျန်: {actualRemaining})" });

        double remCountAfter = actualRemaining - count;
        decimal remWeightAfter = (decimal)remCountAfter * unitWeight;

        var process = new RefinementProcess
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            PurifiedRecordId = dto.PurifiedRecordId,
            Category = dto.Category,
            Count = count,
            Weight = dto.Weight,
            RemainingCountAfter = remCountAfter,
            RemainingWeightAfter = remWeightAfter,
            RefinementWorkerId = dto.RefinementWorkerId
        };

        _context.RefinementProcesses.Add(process);
        await _context.SaveChangesAsync();

        string warehouseName = purifiedRecord.ProcessingRecord?.Product?.Warehouse?.Name ?? "";

        return Ok(new RefinementProcessDto
        {
            Id = process.Id,
            Date = process.Date,
            PurifiedRecordId = process.PurifiedRecordId,
            ProductMarker = purifiedRecord.ProcessingRecord?.Product?.Marker ?? "",
            Category = process.Category,
            Count = process.Count,
            Weight = process.Weight,
            RemainingCountAfter = process.RemainingCountAfter,
            RemainingWeightAfter = process.RemainingWeightAfter,
            WarehouseName = warehouseName,
            RefinementWorkerId = process.RefinementWorkerId,
            RefinementWorkerName = ""
        });
    }

    // PUT /api/refinement/{id}
    // Creates or updates a RefinementRecord linked to the given process
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProcess(int id, [FromBody] CreateRefinementProcessDto dto)
    {
        var process = await _context.RefinementProcesses
            .Include(r => r.PurifiedRecord)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (process == null) return NotFound();

        decimal unitWeight = (decimal)process.PurifiedRecord.Count > 0
            ? process.PurifiedRecord.Weight / (decimal)process.PurifiedRecord.Count
            : 0;
        double count = unitWeight > 0 ? (double)(dto.Weight / unitWeight) : dto.Count;

        var refinementRecord = new RefinementRecord
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            PurifiedRecordId = process.PurifiedRecordId,
            Category = process.Category,
            Count = count,
            Weight = dto.Weight,
            LostWeight = dto.LostWeight,
            SpoilageWeight = dto.SpoilageWeight,
            ReturnWeight = dto.ReturnWeight,
            RemainingCount = count,
            RemainingWeight = dto.Weight,
            RefinementWorkerId = dto.RefinementWorkerId,
            RefinementProcessId = id,
            WorkerFees = dto.WorkerFees
        };
        _context.RefinementRecords.Add(refinementRecord);

        process.WorkerFees = dto.WorkerFees;

        await _context.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/refinement/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcess(int id)
    {
        var process = await _context.RefinementProcesses
            .Include(r => r.RefinementRecords)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (process == null) return NotFound();

        // Remove linked RefinementRecords
        foreach (var rec in process.RefinementRecords.Where(r => r.DeleteFlg == 0))
        {
            _context.RefinementRecords.Remove(rec);
        }

        _context.RefinementProcesses.Remove(process);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/refinement/refinement-records/{id}
    [HttpPut("refinement-records/{id}")]
    public async Task<IActionResult> UpdateRefinementRecord(int id, [FromBody] CreateRefinementProcessDto dto)
    {
        var record = await _context.RefinementRecords
            .Include(r => r.PurifiedRecord)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null) return NotFound();

        decimal unitWeight = (decimal)record.PurifiedRecord.Count > 0
            ? record.PurifiedRecord.Weight / (decimal)record.PurifiedRecord.Count
            : 0;
        double count = unitWeight > 0 ? (double)(dto.Weight / unitWeight) : dto.Count;

        record.Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay);
        record.Count = count;
        record.Weight = dto.Weight;
        record.LostWeight = dto.LostWeight;
        record.SpoilageWeight = dto.SpoilageWeight;
        record.ReturnWeight = dto.ReturnWeight;
        record.RemainingCount = count;
        record.RemainingWeight = dto.Weight;
        record.RefinementWorkerId = dto.RefinementWorkerId;
        record.WorkerFees = dto.WorkerFees;

        // Sync process if exists
        if (record.RefinementProcessId.HasValue)
        {
            var process = await _context.RefinementProcesses.FindAsync(record.RefinementProcessId.Value);
            if (process != null)
            {
                process.Date = record.Date;
                process.Count = count;
                process.Weight = dto.Weight;
                process.RefinementWorkerId = dto.RefinementWorkerId;
                process.WorkerFees = dto.WorkerFees;
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/refinement/refinement-records/{id}
    [HttpDelete("refinement-records/{id}")]
    public async Task<IActionResult> DeleteRefinementRecord(int id)
    {
        var record = await _context.RefinementRecords
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null) return NotFound();


        _context.RefinementRecords.Remove(record);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
