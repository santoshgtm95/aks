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
public class SemiExportController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SemiExportController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SemiExportRecordDto>>> GetRecords()
    {
        var records = await _context.SemiExportRecords
            .Include(s => s.SingleDoubleDrawnRecord)
                .ThenInclude(sdd => sdd.RefinementRecord)
                    .ThenInclude(rr => rr.PurifiedRecord)
                        .ThenInclude(p => p.ProcessingRecord)
                            .ThenInclude(pr => pr.Product)
                                .ThenInclude(prod => prod.Warehouse)
            .Include(s => s.SemiExportPurchaseRecord)
            .Include(s => s.ExchangeRate)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        return Ok(records.Select(ToDto).ToList());
    }

    [HttpGet("by-singledoubledrawn/{id}")]
    public async Task<ActionResult<SemiExportRecordDto?>> GetBySingleDoubleDrawn(int id)
    {
        var r = await _context.SemiExportRecords
            .Include(s => s.SingleDoubleDrawnRecord)
                .ThenInclude(sdd => sdd.RefinementRecord)
                    .ThenInclude(rr => rr.PurifiedRecord)
                        .ThenInclude(p => p.ProcessingRecord)
                            .ThenInclude(pr => pr.Product)
                                .ThenInclude(prod => prod.Warehouse)
            .FirstOrDefaultAsync(x => x.SingleDoubleDrawnRecordId == id);

        if (r == null)
        {
            return Ok(null);
        }

        string marker = "";
        string category = "";
        string warehouseName = "";

        var sdd = r.SingleDoubleDrawnRecord;
        if (sdd?.RefinementRecord != null)
        {
            category = sdd.RefinementRecord.Category;

            if (sdd.RefinementRecord.PurifiedRecord?.ProcessingRecord?.Product != null)
            {
                var product = sdd.RefinementRecord.PurifiedRecord.ProcessingRecord.Product;
                marker = product.Marker;
                warehouseName = product.Warehouse?.Name ?? "";
            }
        }

        var dto = new SemiExportRecordDto
        {
            Id = r.Id,
            Date = r.Date,
            SingleDoubleDrawnRecordId = r.SingleDoubleDrawnRecordId,
            RefinementRecordMarker = marker,
            RefinementRecordCategory = category,
            RefinementRecordWarehouseName = warehouseName,
            WorkerFees = r.WorkerFees,
            Remark = r.Remark,
            ExchangeRateId = r.ExchangeRateId
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SemiExportRecordDto>> UpsertRecord([FromBody] UpsertSemiExportRecordDto dto)
    {
        var sddRecord = await _context.SingleDoubleDrawnRecords
            .Include(sdd => sdd.RefinementRecord)
                .ThenInclude(rr => rr.PurifiedRecord)
                    .ThenInclude(p => p.ProcessingRecord)
                        .ThenInclude(pr => pr.Product)
                            .ThenInclude(prod => prod.Warehouse)
            .FirstOrDefaultAsync(x => x.Id == dto.SingleDoubleDrawnRecordId);

        if (sddRecord == null)
        {
            return BadRequest(new { message = "Single Double Drawn Record not found" });
        }

        var record = await _context.SemiExportRecords
            .FirstOrDefaultAsync(x => x.SingleDoubleDrawnRecordId == dto.SingleDoubleDrawnRecordId);

        if (record == null)
        {
            record = new SemiExportRecord
            {
                Date = DateTime.UtcNow.AddHours(6.5),
                SingleDoubleDrawnRecordId = dto.SingleDoubleDrawnRecordId
            };
            _context.SemiExportRecords.Add(record);
        }

        record.WorkerFees = dto.WorkerFees;
        record.Remark = dto.Remark;
        record.ExchangeRateId = dto.ExchangeRateId;

        await _context.SaveChangesAsync();

        string marker = "";
        string category = "";
        string warehouseName = "";

        if (sddRecord.RefinementRecord != null)
        {
            category = sddRecord.RefinementRecord.Category;

            if (sddRecord.RefinementRecord.PurifiedRecord?.ProcessingRecord?.Product != null)
            {
                var product = sddRecord.RefinementRecord.PurifiedRecord.ProcessingRecord.Product;
                marker = product.Marker;
                warehouseName = product.Warehouse?.Name ?? "";
            }
        }

        var resultDto = new SemiExportRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            SingleDoubleDrawnRecordId = record.SingleDoubleDrawnRecordId,
            RefinementRecordMarker = marker,
            RefinementRecordCategory = category,
            RefinementRecordWarehouseName = warehouseName,
            WorkerFees = record.WorkerFees,
            Remark = record.Remark,
            ExchangeRateId = record.ExchangeRateId
        };

        return Ok(resultDto);
    }

    [HttpPost("purchase-records")]
    public async Task<ActionResult<List<SemiExportRecordDto>>> UpsertPurchaseRecords([FromBody] UpsertSemiExportPurchaseRecordsDto dto)
    {
        if (dto.SemiExportPurchaseRecordIds == null || dto.SemiExportPurchaseRecordIds.Count == 0)
        {
            return BadRequest(new { message = "At least one purchase record is required" });
        }

        var purchaseRecords = await _context.SemiExportPurchaseRecords
            .Where(r => dto.SemiExportPurchaseRecordIds.Contains(r.Id))
            .OrderBy(r => r.Id)
            .ToListAsync();

        if (purchaseRecords.Count == 0)
        {
            return NotFound(new { message = "Purchase records not found" });
        }

        var savedRecords = new List<SemiExportRecord>();
        for (var index = 0; index < purchaseRecords.Count; index++)
        {
            var purchaseRecord = purchaseRecords[index];
            var record = await _context.SemiExportRecords
                .FirstOrDefaultAsync(x => x.SemiExportPurchaseRecordId == purchaseRecord.Id);

            if (record == null)
            {
                record = new SemiExportRecord
                {
                    Date = DateTime.UtcNow.AddHours(6.5),
                    SemiExportPurchaseRecordId = purchaseRecord.Id
                };
                _context.SemiExportRecords.Add(record);
            }

            record.SingleDoubleDrawnRecordId = null;
            record.WorkerFees = index == 0 ? dto.WorkerFees : 0;
            record.Remark = dto.Remark ?? string.Empty;
            record.ExchangeRateId = dto.ExchangeRateId;
            savedRecords.Add(record);
        }

        await _context.SaveChangesAsync();

        return Ok(savedRecords.Select(ToDto).ToList());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecord(int id)
    {
        var record = await _context.SemiExportRecords.FindAsync(id);
        if (record == null)
        {
            return NotFound();
        }

        _context.SemiExportRecords.Remove(record);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static SemiExportRecordDto ToDto(SemiExportRecord r)
    {
        string marker = "";
        string category = "";
        string warehouseName = "";

        var sdd = r.SingleDoubleDrawnRecord;
        if (sdd?.RefinementRecord != null)
        {
            category = sdd.RefinementRecord.Category;

            if (sdd.RefinementRecord.PurifiedRecord?.ProcessingRecord?.Product != null)
            {
                var product = sdd.RefinementRecord.PurifiedRecord.ProcessingRecord.Product;
                marker = product.Marker;
                warehouseName = product.Warehouse?.Name ?? "";
            }
        }

        return new SemiExportRecordDto
        {
            Id = r.Id,
            Date = r.Date,
            SingleDoubleDrawnRecordId = r.SingleDoubleDrawnRecordId,
            SemiExportPurchaseRecordId = r.SemiExportPurchaseRecordId,
            RefinementRecordMarker = marker,
            RefinementRecordCategory = category,
            RefinementRecordWarehouseName = warehouseName,
            WorkerFees = r.WorkerFees,
            Remark = r.Remark,
            ExchangeRateId = r.ExchangeRateId,
            ExchangeRateRate = r.ExchangeRate?.Rate
        };
    }
}
