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

                PriceB = r.PriceB,
                Price28 = r.Price28,
                Price26 = r.Price26,
                Price24 = r.Price24,
                Price22 = r.Price22,
                Price20 = r.Price20,
                Price18 = r.Price18,
                Price16 = r.Price16,
                Price14 = r.Price14,
                Price12 = r.Price12,
                Price10B = r.Price10B,
                Price10 = r.Price10,
                Price9 = r.Price9,
                Price8 = r.Price8,
                Price7 = r.Price7,
                Price6 = r.Price6,
                PriceLeftover = r.PriceLeftover,
                PriceSpoil = r.PriceSpoil,
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

            PriceB = r.PriceB,
            Price28 = r.Price28,
            Price26 = r.Price26,
            Price24 = r.Price24,
            Price22 = r.Price22,
            Price20 = r.Price20,
            Price18 = r.Price18,
            Price16 = r.Price16,
            Price14 = r.Price14,
            Price12 = r.Price12,
            Price10B = r.Price10B,
            Price10 = r.Price10,
            Price9 = r.Price9,
            Price8 = r.Price8,
            Price7 = r.Price7,
            Price6 = r.Price6,
            PriceLeftover = r.PriceLeftover,
            PriceSpoil = r.PriceSpoil,
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

        record.PriceB = dto.PriceB;
        record.Price28 = dto.Price28;
        record.Price26 = dto.Price26;
        record.Price24 = dto.Price24;
        record.Price22 = dto.Price22;
        record.Price20 = dto.Price20;
        record.Price18 = dto.Price18;
        record.Price16 = dto.Price16;
        record.Price14 = dto.Price14;
        record.Price12 = dto.Price12;
        record.Price10B = dto.Price10B;
        record.Price10 = dto.Price10;
        record.Price9 = dto.Price9;
        record.Price8 = dto.Price8;
        record.Price7 = dto.Price7;
        record.Price6 = dto.Price6;
        record.PriceLeftover = dto.PriceLeftover;
        record.PriceSpoil = dto.PriceSpoil;
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

            PriceB = record.PriceB,
            Price28 = record.Price28,
            Price26 = record.Price26,
            Price24 = record.Price24,
            Price22 = record.Price22,
            Price20 = record.Price20,
            Price18 = record.Price18,
            Price16 = record.Price16,
            Price14 = record.Price14,
            Price12 = record.Price12,
            Price10B = record.Price10B,
            Price10 = record.Price10,
            Price9 = record.Price9,
            Price8 = record.Price8,
            Price7 = record.Price7,
            Price6 = record.Price6,
            PriceLeftover = record.PriceLeftover,
            PriceSpoil = record.PriceSpoil,
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
