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
public class ExportController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ExportController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExportDto>>> GetExports()
    {
        var exports = await _context.Exports
            .Include(e => e.Ledger)
            .Include(e => e.ExchangeRate)
            .OrderByDescending(e => e.Date)
            .Select(e => new ExportDto
            {
                Id = e.Id,
                LedgerId = e.LedgerId,
                LedgerName = e.Ledger.LedgerName,
                Date = e.Date,
                SelectedColors = e.SelectedColors,
                SelectedWeight = e.SelectedWeight,
                TotalExportWeightViss = e.TotalExportWeightViss,
                TotalExportWeightKg = e.TotalExportWeightKg,
                ProductAmountMMK = e.ProductAmountMMK,
                ProductAmountCNY = e.ProductAmountCNY,
                WorkerFees = e.WorkerFees,
                GrandTotalMMK = e.GrandTotalMMK,
                ExchangeRateId = e.ExchangeRateId,
                ExchangeRateRate = e.ExchangeRate != null ? e.ExchangeRate.Rate : null,
                SellingPrice = e.SellingPrice
            })
            .ToListAsync();

        return Ok(exports);
    }

    [HttpGet("by-ledger/{ledgerId}")]
    public async Task<ActionResult<List<ExportDto>>> GetExportsByLedger(int ledgerId)
    {
        var exports = await _context.Exports
            .Include(e => e.Ledger)
            .Include(e => e.ExchangeRate)
            .Where(e => e.LedgerId == ledgerId)
            .OrderByDescending(e => e.Date)
            .Select(e => new ExportDto
            {
                Id = e.Id,
                LedgerId = e.LedgerId,
                LedgerName = e.Ledger.LedgerName,
                Date = e.Date,
                SelectedColors = e.SelectedColors,
                SelectedWeight = e.SelectedWeight,
                TotalExportWeightViss = e.TotalExportWeightViss,
                TotalExportWeightKg = e.TotalExportWeightKg,
                ProductAmountMMK = e.ProductAmountMMK,
                ProductAmountCNY = e.ProductAmountCNY,
                WorkerFees = e.WorkerFees,
                GrandTotalMMK = e.GrandTotalMMK,
                ExchangeRateId = e.ExchangeRateId,
                ExchangeRateRate = e.ExchangeRate != null ? e.ExchangeRate.Rate : null,
                SellingPrice = e.SellingPrice
            })
            .ToListAsync();

        return Ok(exports);
    }

    [HttpPost]
    public async Task<ActionResult<ExportDto>> CreateExport([FromBody] CreateExportDto dto)
    {
        var ledger = await _context.Ledgers.FindAsync(dto.LedgerId);
        if (ledger == null)
        {
            return BadRequest("Ledger not found.");
        }

        var export = new Export
        {
            LedgerId = dto.LedgerId,
            Date = dto.Date,
            SelectedColors = dto.SelectedColors,
            SelectedWeight = dto.SelectedWeight,
            TotalExportWeightViss = dto.TotalExportWeightViss,
            TotalExportWeightKg = dto.TotalExportWeightKg,
            ProductAmountMMK = dto.ProductAmountMMK,
            ProductAmountCNY = dto.ProductAmountCNY,
            WorkerFees = dto.WorkerFees,
            GrandTotalMMK = dto.GrandTotalMMK,
            ExchangeRateId = dto.ExchangeRateId > 0 ? dto.ExchangeRateId : null,
            SellingPrice = dto.SellingPrice
        };

        _context.Exports.Add(export);
        await _context.SaveChangesAsync();

        // Load reference
        await _context.Entry(export).Reference(e => e.ExchangeRate).LoadAsync();

        var resultDto = new ExportDto
        {
            Id = export.Id,
            LedgerId = export.LedgerId,
            LedgerName = ledger.LedgerName,
            Date = export.Date,
            SelectedColors = export.SelectedColors,
            SelectedWeight = export.SelectedWeight,
            TotalExportWeightViss = export.TotalExportWeightViss,
            TotalExportWeightKg = export.TotalExportWeightKg,
            ProductAmountMMK = export.ProductAmountMMK,
            ProductAmountCNY = export.ProductAmountCNY,
            WorkerFees = export.WorkerFees,
            GrandTotalMMK = export.GrandTotalMMK,
            ExchangeRateId = export.ExchangeRateId,
            ExchangeRateRate = export.ExchangeRate != null ? export.ExchangeRate.Rate : null,
            SellingPrice = export.SellingPrice
        };

        return Ok(resultDto);
    }
}
