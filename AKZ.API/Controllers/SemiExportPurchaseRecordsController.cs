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
public class SemiExportPurchaseRecordsController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SemiExportPurchaseRecordsController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SemiExportPurchaseRecordDto>>> GetAll()
    {
        var records = await _context.SemiExportPurchaseRecords
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(records.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<SemiExportPurchaseRecordDto>> Create([FromBody] CreateSemiExportPurchaseRecordDto dto)
    {
        var processing = await _context.SemiExportPurchaseProcessings
            .Include(p => p.SemiExportPurchase)
            .Include(p => p.Worker)
            .FirstOrDefaultAsync(p => p.Id == dto.SemiExportPurchaseProcessingId);

        if (processing == null)
        {
            return NotFound(new { message = "Sorting record not found" });
        }

        if (processing.SemiExportPurchase == null)
        {
            return BadRequest(new { message = "Purchase record not found for this sorting record" });
        }

        var record = new SemiExportPurchaseRecord
        {
            SemiExportPurchaseProcessingId = processing.Id,
            SemiExportPurchaseId = processing.SemiExportPurchaseId,
            CustomerName = processing.SemiExportPurchase.CustomerName,
            Contact = processing.SemiExportPurchase.Contact,
            Color = processing.SemiExportPurchase.Color,
            ReceiveDateTime = processing.SemiExportPurchase.ReceiveDateTime,
            AssignWeight = processing.AssignWeight,
            LostWeight = processing.LostWeight,
            WorkerName = processing.Worker?.Name ?? string.Empty,
            WorkerFees = dto.WorkerFees,
            ExchangeRateId = dto.ExchangeRateId,
            ExchangeRateRate = dto.ExchangeRateRate,
            CreatedAt = DateTime.UtcNow
        };

        ApplySizes(record, dto.Sizes);

        _context.SemiExportPurchaseRecords.Add(record);
        await _context.SaveChangesAsync();

        return Ok(ToDto(record));
    }

    private static decimal GetWeight(IReadOnlyDictionary<string, SemiExportPurchaseRecordSizeDto> sizes, string key) =>
        sizes.TryGetValue(key, out var row) ? row.Weight : 0;

    private static decimal GetPrice(IReadOnlyDictionary<string, SemiExportPurchaseRecordSizeDto> sizes, string key) =>
        sizes.TryGetValue(key, out var row) ? row.Price : 0;

    private static void ApplySizes(SemiExportPurchaseRecord record, List<SemiExportPurchaseRecordSizeDto> sizes)
    {
        var map = sizes.ToDictionary(s => s.Size, StringComparer.OrdinalIgnoreCase);

        record.Size6Weight = GetWeight(map, "6");
        record.Size6Price = GetPrice(map, "6");
        record.Size7Weight = GetWeight(map, "7");
        record.Size7Price = GetPrice(map, "7");
        record.Size8Weight = GetWeight(map, "8");
        record.Size8Price = GetPrice(map, "8");
        record.Size9Weight = GetWeight(map, "9");
        record.Size9Price = GetPrice(map, "9");
        record.Size10Weight = GetWeight(map, "10");
        record.Size10Price = GetPrice(map, "10");
        record.Size10BWeight = GetWeight(map, "10B");
        record.Size10BPrice = GetPrice(map, "10B");
        record.Size12Weight = GetWeight(map, "12");
        record.Size12Price = GetPrice(map, "12");
        record.Size14Weight = GetWeight(map, "14");
        record.Size14Price = GetPrice(map, "14");
        record.Size16Weight = GetWeight(map, "16");
        record.Size16Price = GetPrice(map, "16");
        record.Size18Weight = GetWeight(map, "18");
        record.Size18Price = GetPrice(map, "18");
        record.Size20Weight = GetWeight(map, "20");
        record.Size20Price = GetPrice(map, "20");
        record.Size22Weight = GetWeight(map, "22");
        record.Size22Price = GetPrice(map, "22");
        record.Size24Weight = GetWeight(map, "24");
        record.Size24Price = GetPrice(map, "24");
        record.Size26Weight = GetWeight(map, "26");
        record.Size26Price = GetPrice(map, "26");
        record.Size28Weight = GetWeight(map, "28");
        record.Size28Price = GetPrice(map, "28");
        record.SizeBarWeight = GetWeight(map, "Bar");
        record.SizeBarPrice = GetPrice(map, "Bar");
        record.ReturnWeight = GetWeight(map, "Return");
        record.ReturnPrice = GetPrice(map, "Return");
        record.SpoilageWeight = GetWeight(map, "Spoilage");
        record.SpoilagePrice = GetPrice(map, "Spoilage");
        record.LostSizeWeight = GetWeight(map, "Lost");
        record.LostSizePrice = GetPrice(map, "Lost");
    }

    private static SemiExportPurchaseRecordDto ToDto(SemiExportPurchaseRecord record) =>
        new()
        {
            Id = record.Id,
            SemiExportPurchaseProcessingId = record.SemiExportPurchaseProcessingId,
            SemiExportPurchaseId = record.SemiExportPurchaseId,
            CustomerName = record.CustomerName,
            Contact = record.Contact,
            Color = record.Color,
            ReceiveDateTime = record.ReceiveDateTime,
            AssignWeight = record.AssignWeight,
            LostWeight = record.LostWeight,
            WorkerName = record.WorkerName,
            WorkerFees = record.WorkerFees,
            ExchangeRateId = record.ExchangeRateId,
            ExchangeRateRate = record.ExchangeRateRate,
            CreatedAt = record.CreatedAt,
            Sizes =
            [
                new() { Size = "6", Weight = record.Size6Weight, Price = record.Size6Price },
                new() { Size = "7", Weight = record.Size7Weight, Price = record.Size7Price },
                new() { Size = "8", Weight = record.Size8Weight, Price = record.Size8Price },
                new() { Size = "9", Weight = record.Size9Weight, Price = record.Size9Price },
                new() { Size = "10", Weight = record.Size10Weight, Price = record.Size10Price },
                new() { Size = "10B", Weight = record.Size10BWeight, Price = record.Size10BPrice },
                new() { Size = "12", Weight = record.Size12Weight, Price = record.Size12Price },
                new() { Size = "14", Weight = record.Size14Weight, Price = record.Size14Price },
                new() { Size = "16", Weight = record.Size16Weight, Price = record.Size16Price },
                new() { Size = "18", Weight = record.Size18Weight, Price = record.Size18Price },
                new() { Size = "20", Weight = record.Size20Weight, Price = record.Size20Price },
                new() { Size = "22", Weight = record.Size22Weight, Price = record.Size22Price },
                new() { Size = "24", Weight = record.Size24Weight, Price = record.Size24Price },
                new() { Size = "26", Weight = record.Size26Weight, Price = record.Size26Price },
                new() { Size = "28", Weight = record.Size28Weight, Price = record.Size28Price },
                new() { Size = "Bar", Weight = record.SizeBarWeight, Price = record.SizeBarPrice },
                new() { Size = "Return", Weight = record.ReturnWeight, Price = record.ReturnPrice },
                new() { Size = "Spoilage", Weight = record.SpoilageWeight, Price = record.SpoilagePrice },
                new() { Size = "Lost", Weight = record.LostSizeWeight, Price = record.LostSizePrice },
            ]
        };

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _context.SemiExportPurchaseRecords.FindAsync(id);
        if (record == null)
            return NotFound(new { message = "Sorting history record not found" });

        _context.SemiExportPurchaseRecords.Remove(record);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}


