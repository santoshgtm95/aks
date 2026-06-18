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
public class SemiExportPurchaseProcessingController : ControllerBase
{
    private readonly AKZDbContext _context;

    public SemiExportPurchaseProcessingController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SemiExportPurchaseProcessingDto>>> GetAll()
    {
        var records = await _context.SemiExportPurchaseProcessings
            .Include(p => p.SemiExportPurchase)
            .Include(p => p.Worker)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = records.Select(p => new SemiExportPurchaseProcessingDto
        {
            Id = p.Id,
            SemiExportPurchaseId = p.SemiExportPurchaseId,
            CustomerName = p.SemiExportPurchase?.CustomerName ?? "Unknown",
            Contact = p.SemiExportPurchase?.Contact ?? "---",
            ReceiveDateTime = p.SemiExportPurchase?.ReceiveDateTime ?? DateTime.MinValue,
            Color = p.SemiExportPurchase?.Color ?? "Unknown",
            WorkerId = p.WorkerId,
            WorkerName = p.Worker?.Name ?? "Unknown",
            AssignWeight = p.AssignWeight,
            LostWeight = p.LostWeight,
            Status = p.Status,
            CreatedAt = p.CreatedAt
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SemiExportPurchaseProcessingDto>> Create([FromBody] CreateSemiExportPurchaseProcessingDto dto)
    {
        var record = new SemiExportPurchaseProcessing
        {
            SemiExportPurchaseId = dto.SemiExportPurchaseId,
            WorkerId = dto.WorkerId,
            AssignWeight = dto.AssignWeight,
            LostWeight = dto.LostWeight,
            Status = "Processing",
            CreatedAt = DateTime.UtcNow
        };

        _context.SemiExportPurchaseProcessings.Add(record);
        await _context.SaveChangesAsync();

        // Refresh to get navigation properties
        var savedRecord = await _context.SemiExportPurchaseProcessings
            .Include(p => p.SemiExportPurchase)
            .Include(p => p.Worker)
            .FirstAsync(p => p.Id == record.Id);

        var resultDto = new SemiExportPurchaseProcessingDto
        {
            Id = savedRecord.Id,
            SemiExportPurchaseId = savedRecord.SemiExportPurchaseId,
            CustomerName = savedRecord.SemiExportPurchase?.CustomerName ?? "Unknown",
            Contact = savedRecord.SemiExportPurchase?.Contact ?? "---",
            ReceiveDateTime = savedRecord.SemiExportPurchase?.ReceiveDateTime ?? DateTime.MinValue,
            Color = savedRecord.SemiExportPurchase?.Color ?? "Unknown",
            WorkerId = savedRecord.WorkerId,
            WorkerName = savedRecord.Worker?.Name ?? "Unknown",
            AssignWeight = savedRecord.AssignWeight,
            LostWeight = savedRecord.LostWeight,
            Status = savedRecord.Status,
            CreatedAt = savedRecord.CreatedAt
        };

        return Ok(resultDto);
    }
}
