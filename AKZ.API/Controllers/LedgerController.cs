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
public class LedgerController : ControllerBase
{
    private readonly AKZDbContext _context;

    public LedgerController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<LedgerDto>>> GetLedgers()
    {
        var ledgers = await _context.Ledgers
            .Include(l => l.Markers)
            .OrderByDescending(l => l.Date)
            .Select(l => new LedgerDto
            {
                Id = l.Id,
                LedgerName = l.LedgerName,
                Date = l.Date,
                Description = l.Description,
                Markers = l.Markers.Select(m => new LedgerMarkerDto
                {
                    ProductId = m.ProductId,
                    MarkerName = m.MarkerName
                }).ToList()
            })
            .ToListAsync();

        return Ok(ledgers);
    }

    [HttpPost]
    public async Task<ActionResult<LedgerDto>> CreateLedger([FromBody] CreateLedgerDto dto)
    {
        var ledger = new Ledger
        {
            LedgerName = dto.LedgerName,
            Date = dto.Date,
            Description = dto.Description
        };

        foreach (var markerDto in dto.Markers)
        {
            ledger.Markers.Add(new LedgerMarker
            {
                ProductId = markerDto.ProductId,
                MarkerName = markerDto.MarkerName
            });
        }

        _context.Ledgers.Add(ledger);
        await _context.SaveChangesAsync();

        return Ok(new LedgerDto
        {
            Id = ledger.Id,
            LedgerName = ledger.LedgerName,
            Date = ledger.Date,
            Description = ledger.Description,
            Markers = ledger.Markers.Select(m => new LedgerMarkerDto
            {
                ProductId = m.ProductId,
                MarkerName = m.MarkerName
            }).ToList()
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLedger(int id)
    {
        var ledger = await _context.Ledgers.FindAsync(id);
        if (ledger == null) return NotFound();

        _context.Ledgers.Remove(ledger);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
