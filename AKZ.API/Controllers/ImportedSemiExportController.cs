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
public class ImportedSemiExportController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ImportedSemiExportController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ImportedSemiExportDto>>> GetAll()
    {
        var list = await _context.ImportedSemiExports
            .Where(x => x.DeleteFlg == 0)
            .OrderByDescending(x => x.Date)
            .ToListAsync();

        return list.Select(x => new ImportedSemiExportDto
        {
            Id = x.Id,
            MarkerName = x.MarkerName,
            TotalSortedWeight = x.TotalSortedWeight,
            Date = x.Date,
            DataJson = x.DataJson
        }).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<ImportedSemiExportDto>> Create(CreateImportedSemiExportDto dto)
    {
        var entity = new ImportedSemiExport
        {
            MarkerName = dto.MarkerName,
            TotalSortedWeight = dto.TotalSortedWeight,
            Date = dto.Date,
            DataJson = dto.DataJson
        };

        _context.ImportedSemiExports.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(new ImportedSemiExportDto
        {
            Id = entity.Id,
            MarkerName = entity.MarkerName,
            TotalSortedWeight = entity.TotalSortedWeight,
            Date = entity.Date,
            DataJson = entity.DataJson
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.ImportedSemiExports.FindAsync(id);
        if (entity == null) return NotFound();

        entity.DeleteFlg = 1;
        entity.DeleteDate = DateTime.UtcNow;
        // Optionally map DeleteBy from User claims
        
        await _context.SaveChangesAsync();
        return NoContent();
    }
}