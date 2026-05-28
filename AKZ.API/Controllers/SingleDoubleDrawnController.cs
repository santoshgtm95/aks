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
public class SingleDoubleDrawnController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SingleDoubleDrawnController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SingleDoubleDrawnRecordDto>>> GetRecords([FromQuery] int? refinementRecordId = null)
    {
        var query = _context.SingleDoubleDrawnRecords.AsQueryable();

        if (refinementRecordId.HasValue)
        {
            query = query.Where(r => r.RefinementRecordId == refinementRecordId.Value);
        }

        var records = await query
            .Include(r => r.RefinementRecord)
                .ThenInclude(rr => rr.PurifiedRecord)
                    .ThenInclude(p => p.ProcessingRecord)
                        .ThenInclude(pr => pr.Product)
                            .ThenInclude(prod => prod.Warehouse)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<SingleDoubleDrawnRecordDto>();

        foreach (var r in records)
        {
            string marker = "";
            string category = "";
            string warehouseName = "";

            if (r.RefinementRecord != null)
            {
                category = r.RefinementRecord.Category;

                if (r.RefinementRecord.PurifiedRecord?.ProcessingRecord?.Product != null)
                {
                    var product = r.RefinementRecord.PurifiedRecord.ProcessingRecord.Product;
                    marker = product.Marker;
                    warehouseName = product.Warehouse?.Name ?? "";

                    if (string.IsNullOrEmpty(warehouseName) && product.WarehouseId.HasValue)
                    {
                        var warehouse = await _context.Warehouses.FindAsync(product.WarehouseId.Value);
                        if (warehouse != null) warehouseName = warehouse.Name;
                    }
                }
            }

            result.Add(new SingleDoubleDrawnRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                RefinementRecordId = r.RefinementRecordId,
                RefinementRecordMarker = marker,
                RefinementRecordCategory = category,
                RefinementRecordWarehouseName = warehouseName,

                // Two Inches Category
                Size6 = r.Size6,
                Size7 = r.Size7,
                Size8 = r.Size8,
                Size9 = r.Size9,
                Size10 = r.Size10,

                // B to Ten Category
                Size10B = r.Size10B,
                Size12 = r.Size12,
                Size14 = r.Size14,
                Size16 = r.Size16,
                Size18 = r.Size18,
                Size20 = r.Size20,
                Size22 = r.Size22,
                Size24 = r.Size24,
                Size26 = r.Size26,
                Size28 = r.Size28,
                SizeBar = r.SizeBar,

                // Weight tracking
                LostWeight = r.LostWeight == 0 && r.RefinementRecord != null ? r.RefinementRecord.LostWeight : r.LostWeight,
                SpoilageWeight = r.SpoilageWeight == 0 && r.RefinementRecord != null ? r.RefinementRecord.SpoilageWeight : r.SpoilageWeight,
                ReturnWeight = r.ReturnWeight == 0 && r.RefinementRecord != null ? r.RefinementRecord.ReturnWeight : r.ReturnWeight
            });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SingleDoubleDrawnRecordDto>> CreateRecord([FromBody] CreateSingleDoubleDrawnRecordDto dto)
    {
        // Verify refinement record exists and load its navigation chain
        var refinementRecord = await _context.RefinementRecords
            .Include(rr => rr.PurifiedRecord)
                .ThenInclude(p => p.ProcessingRecord)
                    .ThenInclude(pr => pr.Product)
                        .ThenInclude(prod => prod.Warehouse)
            .FirstOrDefaultAsync(rr => rr.Id == dto.RefinementRecordId);

        if (refinementRecord == null)
        {
            return BadRequest(new { message = "Refined Stock record not found" });
        }

        var record = new SingleDoubleDrawnRecord
        {
            Date = dto.Date,
            RefinementRecordId = dto.RefinementRecordId,

            // Two Inches Category
            Size6 = dto.Size6,
            Size7 = dto.Size7,
            Size8 = dto.Size8,
            Size9 = dto.Size9,
            Size10 = dto.Size10,

            // B to Ten Category
            Size10B = dto.Size10B,
            Size12 = dto.Size12,
            Size14 = dto.Size14,
            Size16 = dto.Size16,
            Size18 = dto.Size18,
            Size20 = dto.Size20,
            Size22 = dto.Size22,
            Size24 = dto.Size24,
            Size26 = dto.Size26,
            Size28 = dto.Size28,
            SizeBar = dto.SizeBar,

            // Weight tracking
            LostWeight = refinementRecord.LostWeight,
            SpoilageWeight = refinementRecord.SpoilageWeight,
            ReturnWeight = refinementRecord.ReturnWeight
        };

        _context.SingleDoubleDrawnRecords.Add(record);
        await _context.SaveChangesAsync();

        // Build response DTO with resolved navigation properties
        string marker = "";
        string category = refinementRecord.Category;
        string warehouseName = "";

        if (refinementRecord.PurifiedRecord?.ProcessingRecord?.Product != null)
        {
            var product = refinementRecord.PurifiedRecord.ProcessingRecord.Product;
            marker = product.Marker;
            warehouseName = product.Warehouse?.Name ?? "";
        }

        var resultDto = new SingleDoubleDrawnRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            RefinementRecordId = record.RefinementRecordId,
            RefinementRecordMarker = marker,
            RefinementRecordCategory = category,
            RefinementRecordWarehouseName = warehouseName,

            // Two Inches Category
            Size6 = record.Size6,
            Size7 = record.Size7,
            Size8 = record.Size8,
            Size9 = record.Size9,
            Size10 = record.Size10,

            // B to Ten Category
            Size10B = record.Size10B,
            Size12 = record.Size12,
            Size14 = record.Size14,
            Size16 = record.Size16,
            Size18 = record.Size18,
            Size20 = record.Size20,
            Size22 = record.Size22,
            Size24 = record.Size24,
            Size26 = record.Size26,
            Size28 = record.Size28,
            SizeBar = record.SizeBar,

            // Weight tracking
            LostWeight = record.LostWeight,
            SpoilageWeight = record.SpoilageWeight,
            ReturnWeight = record.ReturnWeight
        };

        return Ok(resultDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecord(int id)
    {
        var record = await _context.SingleDoubleDrawnRecords.FindAsync(id);
        if (record == null)
        {
            return NotFound();
        }

        _context.SingleDoubleDrawnRecords.Remove(record);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
