using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using AKZ.API.Services;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SemiExportPurchaseController : ControllerBase
{
    private readonly AKZDbContext _context;
    private readonly ChangeNotifierService _notifier;

    public SemiExportPurchaseController(AKZDbContext context, ChangeNotifierService notifier)
    {
        _context = context;
        _notifier = notifier;
    }

    [HttpGet]
    public async Task<ActionResult<List<SemiExportPurchaseDto>>> GetAll()
    {
        var records = await _context.SemiExportPurchases
         .Where(p => p.DeleteFlg == 0)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var result = records.Select(r => new SemiExportPurchaseDto
        {
            Id = r.Id,
            CustomerName = r.CustomerName,
            Contact = r.Contact,
            TotalReceiveWeight = r.TotalReceiveWeight,
            ReceiveDateTime = r.ReceiveDateTime,
            Color = r.Color,
            CreatedAt = r.CreatedAt
        }).ToList();

        return Ok(result);
    }

    [HttpGet("by-date")]
    public async Task<ActionResult<List<SemiExportPurchaseDto>>> GetByDate([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        if (fromDate == default || toDate == default)
        {
            return BadRequest(new { message = "From date and to date are required" });
        }

        if (fromDate.Date > toDate.Date)
        {
            return BadRequest(new { message = "From date cannot be later than to date" });
        }

        var from = fromDate.Date;
        var toExclusive = toDate.Date.AddDays(1);

        var records = await _context.SemiExportPurchases
            .Where(p => p.DeleteFlg == 0 && p.ReceiveDateTime >= from && p.ReceiveDateTime < toExclusive)
            .OrderByDescending(r => r.ReceiveDateTime)
            .ToListAsync();

        var result = records.Select(r => new SemiExportPurchaseDto
        {
            Id = r.Id,
            CustomerName = r.CustomerName,
            Contact = r.Contact,
            TotalReceiveWeight = r.TotalReceiveWeight,
            ReceiveDateTime = r.ReceiveDateTime,
            Color = r.Color,
            CreatedAt = r.CreatedAt
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SemiExportPurchaseDto>> GetById(int id)
    {
        var record = await _context.SemiExportPurchases
            .Where(p => p.DeleteFlg == 0 && p.Id == id)
            .FirstOrDefaultAsync();

        if (record == null)
        {
            return NotFound();
        }

        var dto = new SemiExportPurchaseDto
        {
            Id = record.Id,
            CustomerName = record.CustomerName,
            Contact = record.Contact,
            TotalReceiveWeight = record.TotalReceiveWeight,
            ReceiveDateTime = record.ReceiveDateTime,
            Color = record.Color,
            CreatedAt = record.CreatedAt
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SemiExportPurchaseDto>> Create([FromBody] CreateSemiExportPurchaseDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName))
        {
            return BadRequest(new { message = "Customer name is required" });
        }

        var record = new SemiExportPurchase
        {
            CustomerName = dto.CustomerName,
            Contact = dto.Contact,
            TotalReceiveWeight = dto.TotalReceiveWeight,
            ReceiveDateTime = dto.ReceiveDateTime,
            Color = dto.Color,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SemiExportPurchases.Add(record);
        await _context.SaveChangesAsync();
        _notifier.NotifyChange();

        var resultDto = new SemiExportPurchaseDto
        {
            Id = record.Id,
            CustomerName = record.CustomerName,
            Contact = record.Contact,
            TotalReceiveWeight = record.TotalReceiveWeight,
            ReceiveDateTime = record.ReceiveDateTime,
            Color = record.Color,
            CreatedAt = record.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = record.Id }, resultDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _context.SemiExportPurchases.FindAsync(id);

        if (record == null)
        {
            return NotFound();
        }

        _context.SemiExportPurchases.Remove(record);
        await _context.SaveChangesAsync();
        _notifier.NotifyChange();

        return NoContent();
    }
}
