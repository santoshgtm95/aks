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
public class PurificationController : ControllerBase
{
    private readonly AKZDbContext _context;

    public PurificationController(AKZDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null; // null = all warehouses (admin)
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("available-categories")]
    public async Task<ActionResult<List<AvailableCategoryDto>>> GetAvailableCategories()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.ProcessingRecords
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .Where(r => r.DeleteFlg == 0)
            .Where(r => warehouseId == null || r.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        // Fetch all history to check actual remaining amounts
        var history = await _context.PurificationProcesses
            .Where(p => p.DeleteFlg == 0)
            .ToListAsync();

        var result = new List<AvailableCategoryDto>();

        foreach (var r in records)
        {
            string warehouseName = r.Product.Warehouse?.Name ?? "";
            if (string.IsNullOrEmpty(warehouseName) && r.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(r.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            // Helper to get actual remaining count by checking history
            double GetActualRem(string cat, double originalCount) {
                var used = history.Where(h => h.ProcessingRecordId == r.Id && h.Category.ToLower() == cat.ToLower()).Sum(h => h.PurifyCount);
                return originalCount - used;
            }

            decimal GetActualWeight(string cat, decimal originalWeight) {
                var usedWeight = history.Where(h => h.ProcessingRecordId == r.Id && h.Category.ToLower() == cat.ToLower()).Sum(h => h.PurifyWeight);
                return originalWeight - usedWeight;
            }

            void AddIfAvailable(string cat, double origCount, decimal origWeight) {
                if (origCount <= 0) return;
                double actualRem = GetActualRem(cat, origCount);
                if (actualRem > 0) {
                    result.Add(new AvailableCategoryDto { 
                        ProcessingRecordId = r.Id, 
                        ProductId = r.ProductId, 
                        ProductMarker = r.Product.Marker, 
                        WarehouseName = warehouseName, 
                        WarehouseId = r.Product.WarehouseId, 
                        Category = cat, 
                        RemainingCount = actualRem, 
                        RemainingWeight = GetActualWeight(cat, origWeight), 
                        UnitWeight = r.UnitWeight 
                    });
                }
            }

            AddIfAvailable("Red", r.RedCount, r.RedWeight);
            AddIfAvailable("White", r.WhiteCount, r.WhiteWeight);
            AddIfAvailable("Simple", r.SpecialCount, r.SpecialWeight);
            AddIfAvailable("Natural", r.NaturalCount, r.NaturalWeight);
            AddIfAvailable("N.White", r.NaturalWhiteCount, r.NaturalWhiteWeight);
            AddIfAvailable("N.Red", r.NaturalRedCount, r.NaturalRedWeight);
            AddIfAvailable("S.Cut", r.ShortCutCount, r.ShortCutWeight);
            AddIfAvailable("Art", r.ArtificialCount, r.ArtificialWeight);
            AddIfAvailable("Short", r.ShortCount, r.ShortWeight);
        }

        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<PurificationProcessDto>>> GetProcesses()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var processes = await _context.PurificationProcesses
            .Include(p => p.ProcessingRecord)
                .ThenInclude(r => r.Product)
                    .ThenInclude(pr => pr.Warehouse)
            .Include(p => p.Purifier)
            .Include(p => p.PurifiedRecords)
            .Where(p => p.DeleteFlg == 0)
            .Where(p => warehouseId == null || p.ProcessingRecord.Product.WarehouseId == warehouseId)
            .OrderByDescending(p => p.Date)
            .ToListAsync();

        var result = new List<PurificationProcessDto>();

        foreach (var p in processes)
        {
            double remainingCount = p.PurifyCount - p.PurifiedRecords.Where(pr => pr.DeleteFlg == 0).Sum(pr => pr.Count);
            
            // Only show records that still have balance to be registered
            if (remainingCount <= 0) continue;

            string warehouseName = p.ProcessingRecord.Product.Warehouse?.Name ?? "";

            if (string.IsNullOrEmpty(warehouseName) && p.ProcessingRecord.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(p.ProcessingRecord.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            result.Add(new PurificationProcessDto
            {
                Id = p.Id,
                Date = p.Date,
                ProcessingRecordId = p.ProcessingRecordId,
                ProductMarker = p.ProcessingRecord.Product.Marker,
                Category = p.Category,
                PurifyCount = remainingCount,
                PurifyWeight = p.PurifyWeight - p.PurifiedRecords.Where(pr => pr.DeleteFlg == 0).Sum(pr => pr.Weight),
                RemainingCountAfter = p.RemainingCountAfter,
                RemainingWeightAfter = p.RemainingWeightAfter,
                WarehouseName = warehouseName,
                PurifierId = p.PurifierId,
                PurifierName = p.Purifier != null ? p.Purifier.Name : "",
                IsWeightFull = p.IsWeightFull,
                WorkerFees = p.WorkerFees
            });
        }

        return Ok(result);
    }

    [HttpGet("purified-records")]
    public async Task<ActionResult<List<PurifiedRecordDto>>> GetPurifiedRecords()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.PurifiedRecords
            .Include(p => p.PurificationProcess)
            .Include(p => p.ProcessingRecord)
                .ThenInclude(r => r.Product)
                    .ThenInclude(pr => pr.Warehouse)
            .Include(p => p.Purifier)
            .Where(p => p.DeleteFlg == 0)
            .Where(p => warehouseId == null || p.ProcessingRecord.Product.WarehouseId == warehouseId)
            .OrderByDescending(p => p.Date)
            .ToListAsync();

        var result = new List<PurifiedRecordDto>();

        foreach (var p in records)
        {
            if (p.ProcessingRecord?.Product == null) continue;
            string warehouseName = p.ProcessingRecord.Product.Warehouse?.Name ?? "";
            if (string.IsNullOrEmpty(warehouseName) && p.ProcessingRecord.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(p.ProcessingRecord.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            result.Add(new PurifiedRecordDto
            {
                Id = p.Id,
                Date = p.Date,
                ProcessingRecordId = p.ProcessingRecordId,
                ProductMarker = p.ProcessingRecord.Product.Marker,
                Category = p.Category,
                Count = p.Count,
                Weight = p.Weight,
                WarehouseName = warehouseName,
                PurifierId = p.PurifierId,
                PurifierName = p.Purifier != null ? p.Purifier.Name : "",
                IsWeightFull = p.IsWeightFull,
                WorkerFees = p.PurificationProcess != null ? p.PurificationProcess.WorkerFees : 0
            });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PurificationProcessDto>> CreateProcess([FromBody] CreatePurificationProcessDto dto)
    {
        var record = await _context.ProcessingRecords
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .FirstOrDefaultAsync(r => r.Id == dto.ProcessingRecordId);

        if (record == null) return BadRequest(new { message = "Processing record not found" });

        decimal purifyWeight = (decimal)dto.PurifyCount * record.UnitWeight;
        double remCount = 0;
        decimal remWeight = 0;

        if (!ApplyInventory(record, dto.Category, dto.PurifyCount, purifyWeight, out remCount, out remWeight))
        {
            return BadRequest(new { message = "လက်ကျန် မလုံလောက်ပါ" });
        }

        var process = new PurificationProcess
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProcessingRecordId = dto.ProcessingRecordId,
            Category = dto.Category,
            PurifyCount = dto.PurifyCount,
            PurifyWeight = purifyWeight,
            RemainingCountAfter = remCount,
            RemainingWeightAfter = remWeight,
            PurifierId = dto.PurifierId,
            IsWeightFull = dto.IsWeightFull
        };

        _context.PurificationProcesses.Add(process);
        await _context.SaveChangesAsync();

        string warehouseName = record.Product.Warehouse?.Name ?? "";
        if (string.IsNullOrEmpty(warehouseName) && record.Product.WarehouseId.HasValue)
        {
            var warehouse = await _context.Warehouses.FindAsync(record.Product.WarehouseId.Value);
            if (warehouse != null) warehouseName = warehouse.Name;
        }

        string purifierName = "";
        if (process.PurifierId.HasValue)
        {
            var purifier = await _context.Purifiers.FindAsync(process.PurifierId.Value);
            if (purifier != null) purifierName = purifier.Name;
        }

        return Ok(new PurificationProcessDto
        {
            Id = process.Id,
            Date = process.Date,
            ProcessingRecordId = process.ProcessingRecordId,
            ProductMarker = record.Product.Marker,
            Category = process.Category,
            PurifyCount = process.PurifyCount,
            PurifyWeight = process.PurifyWeight,
            RemainingCountAfter = process.RemainingCountAfter,
            RemainingWeightAfter = process.RemainingWeightAfter,
            WarehouseName = warehouseName,
            PurifierId = process.PurifierId,
            PurifierName = purifierName,
            IsWeightFull = process.IsWeightFull,
            WorkerFees = process.WorkerFees
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProcess(int id, [FromBody] CreatePurificationProcessDto dto)
    {
        // Find the process to get context, but we won't necessarily update it if the user wants separation
        var process = await _context.PurificationProcesses
            .Include(p => p.ProcessingRecord)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (process == null) return NotFound();

        // Check if a record already exists for this specific process
        var purifiedRecord = await _context.PurifiedRecords
            .FirstOrDefaultAsync(p => p.PurificationProcessId == id);

        decimal unitWeight = process.ProcessingRecord.UnitWeight;
        decimal newWeight = (decimal)dto.PurifyCount * unitWeight;

        if (purifiedRecord == null)
        {
            // Create new record (Step 2)
            purifiedRecord = new PurifiedRecord
            {
                Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
                ProcessingRecordId = dto.ProcessingRecordId,
                Category = dto.Category,
                Count = dto.PurifyCount,
                Weight = newWeight,
                RemainingCount = dto.PurifyCount,
                RemainingWeight = newWeight,
                PurifierId = dto.PurifierId,
                IsWeightFull = dto.IsWeightFull,
                PurificationProcessId = id
            };
            _context.PurifiedRecords.Add(purifiedRecord);
        }
        else
        {
            // Update existing record
            purifiedRecord.Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay);
            purifiedRecord.Category = dto.Category;
            purifiedRecord.Count = dto.PurifyCount;
            purifiedRecord.Weight = newWeight;
            purifiedRecord.RemainingCount = dto.PurifyCount;
            purifiedRecord.RemainingWeight = newWeight;
            purifiedRecord.PurifierId = dto.PurifierId;
            purifiedRecord.IsWeightFull = dto.IsWeightFull;
        }

        // We update the 'process' (PurificationProcess) with WorkerFees
        process.WorkerFees = dto.WorkerFees;
        
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcess(int id)
    {
        var process = await _context.PurificationProcesses
            .Include(p => p.ProcessingRecord)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (process == null) return NotFound();

        var purifiedRecord = await _context.PurifiedRecords
            .FirstOrDefaultAsync(p => p.Date == process.Date && 
                                     p.ProcessingRecordId == process.ProcessingRecordId && 
                                     p.Category == process.Category &&
                                     p.Count == process.PurifyCount);

        var record = process.ProcessingRecord;
        decimal unitWeight = record.UnitWeight;

        // Revert inventory
        RevertInventory(record, process.Category, process.PurifyCount, unitWeight);

        _context.PurificationProcesses.Remove(process);
        if (purifiedRecord != null) _context.PurifiedRecords.Remove(purifiedRecord);
        
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("purified-records/{id}")]
    public async Task<IActionResult> UpdatePurifiedRecord(int id, [FromBody] CreatePurificationProcessDto dto)
    {
        var record = await _context.PurifiedRecords
            .Include(p => p.ProcessingRecord)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (record == null) return NotFound();

        // Sync with process history
        var process = await _context.PurificationProcesses
            .FirstOrDefaultAsync(p => p.Date == record.Date && 
                                     p.ProcessingRecordId == record.ProcessingRecordId && 
                                     p.Category == record.Category &&
                                     p.PurifyCount == record.Count);

        var procRecord = record.ProcessingRecord;
        decimal unitWeight = procRecord.UnitWeight;

        RevertInventory(procRecord, record.Category, record.Count, unitWeight);

        decimal newWeight = (decimal)dto.PurifyCount * unitWeight;
        double remCount = 0;
        decimal remWeight = 0;

        if (!ApplyInventory(procRecord, dto.Category, dto.PurifyCount, newWeight, out remCount, out remWeight))
        {
            ApplyInventory(procRecord, record.Category, record.Count, record.Weight, out _, out _);
            return BadRequest(new { message = "Insufficient inventory" });
        }

        record.Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay);
        record.Category = dto.Category;
        record.Count = dto.PurifyCount;
        record.Weight = newWeight;
        record.RemainingCount = dto.PurifyCount;
        record.RemainingWeight = newWeight;
        record.PurifierId = dto.PurifierId;
        record.IsWeightFull = dto.IsWeightFull;

        if (process != null)
        {
            process.Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay);
            process.Category = dto.Category;
            process.PurifyCount = dto.PurifyCount;
            process.PurifyWeight = newWeight;
            process.RemainingCountAfter = remCount;
            process.RemainingWeightAfter = remWeight;
            process.PurifierId = dto.PurifierId;
            process.IsWeightFull = dto.IsWeightFull;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("purified-records/{id}")]
    public async Task<IActionResult> DeletePurifiedRecord(int id)
    {
        var record = await _context.PurifiedRecords
            .Include(p => p.ProcessingRecord)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (record == null) return NotFound();

        var process = await _context.PurificationProcesses
            .FirstOrDefaultAsync(p => p.Date == record.Date && 
                                     p.ProcessingRecordId == record.ProcessingRecordId && 
                                     p.Category == record.Category &&
                                     p.PurifyCount == record.Count);

        RevertInventory(record.ProcessingRecord, record.Category, record.Count, record.ProcessingRecord.UnitWeight);

        _context.PurifiedRecords.Remove(record);
        if (process != null) _context.PurificationProcesses.Remove(process);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private void RevertInventory(ProcessingRecord record, string category, double count, decimal unitWeight)
    {
        decimal weight = (decimal)count * unitWeight;
        switch (category.ToLower())
        {
            case "red": record.RemRedCount += count; record.RemRedWeight += weight; break;
            case "white": record.RemWhiteCount += count; record.RemWhiteWeight += weight; break;
            case "simple": record.RemSpecialCount += count; record.RemSpecialWeight += weight; break;
            case "natural": record.RemNaturalCount += count; record.RemNaturalWeight += weight; break;
            case "n.white": record.RemNaturalWhiteCount += count; record.RemNaturalWhiteWeight += weight; break;
            case "n.red": record.RemNaturalRedCount += count; record.RemNaturalRedWeight += weight; break;
            case "s.cut": record.RemShortCutCount += count; record.RemShortCutWeight += weight; break;
            case "art": record.RemArtificialCount += count; record.RemArtificialWeight += weight; break;
            case "short": record.RemShortCount += count; record.RemShortWeight += weight; break;
        }
    }

    private bool ApplyInventory(ProcessingRecord record, string category, double count, decimal weight, out double remCount, out decimal remWeight)
    {
        remCount = 0;
        remWeight = 0;
        switch (category.ToLower())
        {
            case "red":
                if (record.RemRedCount < count) return false;
                record.RemRedCount -= count; record.RemRedWeight -= weight;
                remCount = record.RemRedCount; remWeight = record.RemRedWeight;
                break;
            case "white":
                if (record.RemWhiteCount < count) return false;
                record.RemWhiteCount -= count; record.RemWhiteWeight -= weight;
                remCount = record.RemWhiteCount; remWeight = record.RemWhiteWeight;
                break;
            case "simple":
                if (record.RemSpecialCount < count) return false;
                record.RemSpecialCount -= count; record.RemSpecialWeight -= weight;
                remCount = record.RemSpecialCount; remWeight = record.RemSpecialWeight;
                break;
            case "natural":
                if (record.RemNaturalCount < count) return false;
                record.RemNaturalCount -= count; record.RemNaturalWeight -= weight;
                remCount = record.RemNaturalCount; remWeight = record.RemNaturalWeight;
                break;
            case "n.white":
                if (record.RemNaturalWhiteCount < count) return false;
                record.RemNaturalWhiteCount -= count; record.RemNaturalWhiteWeight -= weight;
                remCount = record.RemNaturalWhiteCount; remWeight = record.RemNaturalWhiteWeight;
                break;
            case "n.red":
                if (record.RemNaturalRedCount < count) return false;
                record.RemNaturalRedCount -= count; record.RemNaturalRedWeight -= weight;
                remCount = record.RemNaturalRedCount; remWeight = record.RemNaturalRedWeight;
                break;
            case "s.cut":
                if (record.RemShortCutCount < count) return false;
                record.RemShortCutCount -= count; record.RemShortCutWeight -= weight;
                remCount = record.RemShortCutCount; remWeight = record.RemShortCutWeight;
                break;
            case "art":
                if (record.RemArtificialCount < count) return false;
                record.RemArtificialCount -= count; record.RemArtificialWeight -= weight;
                remCount = record.RemArtificialCount; remWeight = record.RemArtificialWeight;
                break;
            case "short":
                if (record.RemShortCount < count) return false;
                record.RemShortCount -= count; record.RemShortWeight -= weight;
                remCount = record.RemShortCount; remWeight = record.RemShortWeight;
                break;
            default: return false;
        }
        return true;
    }
}
