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
public class ProcessingController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ProcessingController(AKZDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProcessingRecordDto>>> GetRecords()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.ProcessingRecords
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(r => r.Workers)
                .ThenInclude(w => w.MessLabourWorker)
            .Where(r => warehouseId == null || r.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .Select(r => new ProcessingRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                ProductId = r.ProductId,
                ProductMarker = r.Product.Marker,
                WarehouseName = r.Product.Warehouse != null ? r.Product.Warehouse.Name : "",
                WorkerNames = r.WorkerNames,
                Count = r.Count,
                RemainingCount = r.RemainingCount,
                UnitWeight = r.UnitWeight,
                RedWeight = r.RedWeight,
                RedCount = r.RedCount,
                WhiteWeight = r.WhiteWeight,
                WhiteCount = r.WhiteCount,
                SpecialWeight = r.SpecialWeight,
                SpecialCount = r.SpecialCount,
                NaturalWeight = r.NaturalWeight,
                NaturalCount = r.NaturalCount,
                NaturalWhiteWeight = r.NaturalWhiteWeight,
                NaturalWhiteCount = r.NaturalWhiteCount,
                NaturalRedWeight = r.NaturalRedWeight,
                NaturalRedCount = r.NaturalRedCount,
                ShortCutWeight = r.ShortCutWeight,
                ShortCutCount = r.ShortCutCount,
                ArtificialWeight = r.ArtificialWeight,
                ArtificialCount = r.ArtificialCount,
                ShortWeight = r.ShortWeight,
                ShortCount = r.ShortCount,
                LossWeight = r.LossWeight,
                TotalWeight = r.TotalWeight,
                RemainingWeight = r.RemainingWeight,
                RemainingWeightKg = r.RemainingWeightKg,
                Difference = r.Difference,
                WorkerFees = r.WorkerFees,
                Workers = r.Workers.Select(w => new ProcessingRecordWorkerDto 
                {
                    MessLabourWorkerId = w.MessLabourWorkerId,
                    MessLabourWorkerName = w.MessLabourWorker.Name,
                    WorkerFee = w.WorkerFee
                }).ToList(),
                RemRedCount = r.RemRedCount,
                RemWhiteCount = r.RemWhiteCount,
                RemSpecialCount = r.RemSpecialCount,
                RemNaturalCount = r.RemNaturalCount,
                RemNaturalWhiteCount = r.RemNaturalWhiteCount,
                RemNaturalRedCount = r.RemNaturalRedCount,
                RemShortCutCount = r.RemShortCutCount,
                RemArtificialCount = r.RemArtificialCount,
                RemShortCount = r.RemShortCount,
                RemRedWeight = r.RemRedWeight,
                RemWhiteWeight = r.RemWhiteWeight,
                RemSpecialWeight = r.RemSpecialWeight,
                RemNaturalWeight = r.RemNaturalWeight,
                RemNaturalWhiteWeight = r.RemNaturalWhiteWeight,
                RemNaturalRedWeight = r.RemNaturalRedWeight,
                RemShortCutWeight = r.RemShortCutWeight,
                RemArtificialWeight = r.RemArtificialWeight,
                RemShortWeight = r.RemShortWeight,
                IsLocked = _context.PurificationProcesses.Any(p => p.ProcessingRecordId == r.Id && p.DeleteFlg == 0) ||
                           _context.PurifiedRecords.Any(pr => pr.ProcessingRecordId == r.Id && pr.DeleteFlg == 0)
            })
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost]
    public async Task<ActionResult<ProcessingRecordDto>> CreateRecord([FromBody] CreateProcessingRecordDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return BadRequest(new { message = "Product not found" });
        }

        var record = new ProcessingRecord
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProductId = dto.ProductId,
            WorkerNames = dto.WorkerNames,
            Count = dto.Count,
            RemainingCount = dto.RemainingCount,
            UnitWeight = dto.UnitWeight,
            RedWeight = dto.RedWeight,
            RedCount = dto.RedCount,
            WhiteWeight = dto.WhiteWeight,
            WhiteCount = dto.WhiteCount,
            SpecialWeight = dto.SpecialWeight,
            SpecialCount = dto.SpecialCount,
            NaturalWeight = dto.NaturalWeight,
            NaturalCount = dto.NaturalCount,
            NaturalWhiteWeight = dto.NaturalWhiteWeight,
            NaturalWhiteCount = dto.NaturalWhiteCount,
            NaturalRedWeight = dto.NaturalRedWeight,
            NaturalRedCount = dto.NaturalRedCount,
            ShortCutWeight = dto.ShortCutWeight,
            ShortCutCount = dto.ShortCutCount,
            ArtificialWeight = dto.ArtificialWeight,
            ArtificialCount = dto.ArtificialCount,
            ShortWeight = dto.ShortWeight,
            ShortCount = dto.ShortCount,
            LossWeight = dto.LossWeight,
            TotalWeight = dto.TotalWeight,
            RemainingWeight = dto.RemainingWeight,
            RemainingWeightKg = dto.RemainingWeightKg,
            Difference = dto.Difference,
            WorkerFees = dto.WorkerFees,
            Workers = dto.Workers.Select(w => new ProcessingRecordWorker
            {
                MessLabourWorkerId = w.MessLabourWorkerId,
                WorkerFee = w.WorkerFee
            }).ToList(),
            // Initialize remaining fields with original counts/weights
            RemRedCount = dto.RedCount,
            RemWhiteCount = dto.WhiteCount,
            RemSpecialCount = dto.SpecialCount,
            RemNaturalCount = dto.NaturalCount,
            RemNaturalWhiteCount = dto.NaturalWhiteCount,
            RemNaturalRedCount = dto.NaturalRedCount,
            RemShortCutCount = dto.ShortCutCount,
            RemArtificialCount = dto.ArtificialCount,
            RemShortCount = dto.ShortCount,
            RemRedWeight = dto.RedWeight,
            RemWhiteWeight = dto.WhiteWeight,
            RemSpecialWeight = dto.SpecialWeight,
            RemNaturalWeight = dto.NaturalWeight,
            RemNaturalWhiteWeight = dto.NaturalWhiteWeight,
            RemNaturalRedWeight = dto.NaturalRedWeight,
            RemShortCutWeight = dto.ShortCutWeight,
            RemArtificialWeight = dto.ArtificialWeight,
            RemShortWeight = dto.ShortWeight
        };

        _context.ProcessingRecords.Add(record);

        // DATA FROM MESS-LABOUR IS IN VISS. 
        // If product unit is KG, convert Viss to KG before updating Products table.
        string productUnit = (product.Unit ?? "").ToLower().Trim();
        bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
        
        decimal categorizedWeight = dto.RedWeight + dto.WhiteWeight + dto.SpecialWeight + 
                                    dto.NaturalWeight + dto.NaturalWhiteWeight + dto.NaturalRedWeight + 
                                    dto.ShortCutWeight + dto.ArtificialWeight + dto.ShortWeight +
                                    dto.LossWeight;

        // The UI calculates remaining as: rwViss - categorizedWeight
        // Therefore, we deduct categorizedWeight to match the UI's remaining weight exactly.
        decimal processedWeightInProductUnit = isProductKg 
            ? categorizedWeight * 1.633m 
            : categorizedWeight;

        // Update the Products table RemainingWeight
        product.RemainingWeight -= processedWeightInProductUnit;
        
        // Safeguard: Prevent small floating point errors from showing near-zero values
        if (Math.Abs(product.RemainingWeight) < 0.0001m)
        {
            product.RemainingWeight = 0;
        }

        await _context.SaveChangesAsync();

        await _context.Entry(record).Reference(r => r.Product).LoadAsync();
        await _context.Entry(record.Product).Reference(p => p.Warehouse).LoadAsync();

        var resultDto = new ProcessingRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            ProductId = record.ProductId,
            ProductMarker = record.Product.Marker,
            WarehouseName = record.Product.Warehouse != null ? record.Product.Warehouse.Name : "",
            WorkerNames = record.WorkerNames,
            Count = record.Count,
            RemainingCount = record.RemainingCount,
            UnitWeight = record.UnitWeight,
            RedWeight = record.RedWeight,
            RedCount = record.RedCount,
            WhiteWeight = record.WhiteWeight,
            WhiteCount = record.WhiteCount,
            SpecialWeight = record.SpecialWeight,
            SpecialCount = record.SpecialCount,
            NaturalWeight = record.NaturalWeight,
            NaturalCount = record.NaturalCount,
            NaturalWhiteWeight = record.NaturalWhiteWeight,
            NaturalWhiteCount = record.NaturalWhiteCount,
            NaturalRedWeight = record.NaturalRedWeight,
            NaturalRedCount = record.NaturalRedCount,
            ShortCutWeight = record.ShortCutWeight,
            ShortCutCount = record.ShortCutCount,
            ArtificialWeight = record.ArtificialWeight,
            ArtificialCount = record.ArtificialCount,
            ShortWeight = record.ShortWeight,
            ShortCount = record.ShortCount,
            LossWeight = record.LossWeight,
            TotalWeight = record.TotalWeight,
            RemainingWeight = record.RemainingWeight,
            RemainingWeightKg = record.RemainingWeightKg,
            Difference = record.Difference,
            WorkerFees = record.WorkerFees,
            Workers = record.Workers?.Select(w => new ProcessingRecordWorkerDto 
            {
                MessLabourWorkerId = w.MessLabourWorkerId,
                WorkerFee = w.WorkerFee
            }).ToList() ?? new List<ProcessingRecordWorkerDto>()
        };

        return Ok(resultDto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProcessingRecordDto>> UpdateRecord(int id, [FromBody] CreateProcessingRecordDto dto)
    {
        var record = await _context.ProcessingRecords
            .Include(r => r.Product)
            .Include(r => r.Workers)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
            return NotFound(new { message = "Record not found" });

        bool isLocked = await _context.PurificationProcesses.AnyAsync(p => p.ProcessingRecordId == id && p.DeleteFlg == 0) ||
                        await _context.PurifiedRecords.AnyAsync(pr => pr.ProcessingRecordId == id && pr.DeleteFlg == 0);

        if (isLocked)
            return BadRequest(new { message = "ဤမှတ်တမ်းကို purification တွင် အသုံးပြုထားသောကြောင့် ပြင်ဆင်၍မရပါ (Record is used in purification and cannot be edited)" });

        var product = record.Product;
        string productUnit = (product.Unit ?? "").ToLower().Trim();
        bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");

        decimal oldCategorizedWeight = record.RedWeight + record.WhiteWeight + record.SpecialWeight + 
                                       record.NaturalWeight + record.NaturalWhiteWeight + record.NaturalRedWeight + 
                                       record.ShortCutWeight + record.ArtificialWeight + record.ShortWeight +
                                       record.LossWeight;

        // Revert old weight deduction (convert Viss back to product unit)
        decimal oldDeduction = isProductKg ? oldCategorizedWeight * 1.633m : oldCategorizedWeight;
        product.RemainingWeight += oldDeduction;

        decimal newCategorizedWeight = dto.RedWeight + dto.WhiteWeight + dto.SpecialWeight + 
                                       dto.NaturalWeight + dto.NaturalWhiteWeight + dto.NaturalRedWeight + 
                                       dto.ShortCutWeight + dto.ArtificialWeight + dto.ShortWeight +
                                       dto.LossWeight;

        // Apply new weight deduction (convert new Viss to product unit)
        decimal newDeduction = isProductKg ? newCategorizedWeight * 1.633m : newCategorizedWeight;
        product.RemainingWeight -= newDeduction;

        record.Date = dto.Date;
        record.WorkerNames = dto.WorkerNames;
        record.Count = dto.Count;
        record.RemainingCount = dto.RemainingCount;
        record.UnitWeight = dto.UnitWeight;
        record.RedWeight = dto.RedWeight;
        record.RedCount = dto.RedCount;
        record.WhiteWeight = dto.WhiteWeight;
        record.WhiteCount = dto.WhiteCount;
        record.SpecialWeight = dto.SpecialWeight;
        record.SpecialCount = dto.SpecialCount;
        record.NaturalWeight = dto.NaturalWeight;
        record.NaturalCount = dto.NaturalCount;
        record.NaturalWhiteWeight = dto.NaturalWhiteWeight;
        record.NaturalWhiteCount = dto.NaturalWhiteCount;
        record.NaturalRedWeight = dto.NaturalRedWeight;
        record.NaturalRedCount = dto.NaturalRedCount;
        record.ShortCutWeight = dto.ShortCutWeight;
        record.ShortCutCount = dto.ShortCutCount;
        record.ArtificialWeight = dto.ArtificialWeight;
        record.ArtificialCount = dto.ArtificialCount;
        record.ShortWeight = dto.ShortWeight;
        record.ShortCount = dto.ShortCount;
        record.LossWeight = dto.LossWeight;
        record.TotalWeight = dto.TotalWeight;
        record.RemainingWeight = dto.RemainingWeight;
        record.RemainingWeightKg = dto.RemainingWeightKg;
        record.Difference = dto.Difference;
        record.WorkerFees = dto.WorkerFees;

        _context.ProcessingRecordWorkers.RemoveRange(record.Workers);
        record.Workers = dto.Workers.Select(w => new ProcessingRecordWorker
        {
            MessLabourWorkerId = w.MessLabourWorkerId,
            WorkerFee = w.WorkerFee
        }).ToList();

        await _context.SaveChangesAsync();

        var resultDto = new ProcessingRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            ProductId = record.ProductId,
            ProductMarker = record.Product.Marker,
            WorkerNames = record.WorkerNames,
            Count = record.Count,
            RemainingCount = record.RemainingCount,
            UnitWeight = record.UnitWeight,
            RedWeight = record.RedWeight,
            RedCount = record.RedCount,
            WhiteWeight = record.WhiteWeight,
            WhiteCount = record.WhiteCount,
            SpecialWeight = record.SpecialWeight,
            SpecialCount = record.SpecialCount,
            NaturalWeight = record.NaturalWeight,
            NaturalCount = record.NaturalCount,
            NaturalWhiteWeight = record.NaturalWhiteWeight,
            NaturalWhiteCount = record.NaturalWhiteCount,
            NaturalRedWeight = record.NaturalRedWeight,
            NaturalRedCount = record.NaturalRedCount,
            ShortCutWeight = record.ShortCutWeight,
            ShortCutCount = record.ShortCutCount,
            ArtificialWeight = record.ArtificialWeight,
            ArtificialCount = record.ArtificialCount,
            ShortWeight = record.ShortWeight,
            ShortCount = record.ShortCount,
            LossWeight = record.LossWeight,
            TotalWeight = record.TotalWeight,
            RemainingWeight = record.RemainingWeight,
            RemainingWeightKg = record.RemainingWeightKg,
            Difference = record.Difference,
            WorkerFees = record.WorkerFees
        };

        return Ok(resultDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecord(int id)
    {
        var record = await _context.ProcessingRecords
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
            return NotFound(new { message = "Record not found" });

        bool isLocked = await _context.PurificationProcesses.AnyAsync(p => p.ProcessingRecordId == id && p.DeleteFlg == 0) ||
                        await _context.PurifiedRecords.AnyAsync(pr => pr.ProcessingRecordId == id && pr.DeleteFlg == 0);

        if (isLocked)
            return BadRequest(new { message = "ဤမှတ်တမ်းကို purification တွင် အသုံးပြုထားသောကြောင့် ဖျက်၍မရပါ (Record is used in purification and cannot be deleted)" });

        // Restore product weight (convert Viss back to product unit)
        string productUnit = (record.Product.Unit ?? "").ToLower().Trim();
        bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
        
        decimal oldCategorizedWeight = record.RedWeight + record.WhiteWeight + record.SpecialWeight + 
                                       record.NaturalWeight + record.NaturalWhiteWeight + record.NaturalRedWeight + 
                                       record.ShortCutWeight + record.ArtificialWeight + record.ShortWeight +
                                       record.LossWeight;

        decimal restoreWeight = isProductKg ? oldCategorizedWeight * 1.633m : oldCategorizedWeight;

        record.Product.RemainingWeight += restoreWeight;

        _context.ProcessingRecords.Remove(record);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
