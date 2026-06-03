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
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<SemiExportRecordDto>();

        foreach (var r in records)
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

            result.Add(new SemiExportRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                SingleDoubleDrawnRecordId = r.SingleDoubleDrawnRecordId,
                RefinementRecordMarker = marker,
                RefinementRecordCategory = category,
                RefinementRecordWarehouseName = warehouseName,
                WorkerFees = r.WorkerFees,
                Remark = r.Remark
            });
        }

        return Ok(result);
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
            Remark = r.Remark
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
            Remark = record.Remark
        };

        return Ok(resultDto);
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
}
