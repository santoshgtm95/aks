using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using System.Text.Json;

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
                SellingPrice = e.SellingPrice,
                SizeSellingPrices = e.SizeSellingPrices
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
                SellingPrice = e.SellingPrice,
                SizeSellingPrices = e.SizeSellingPrices
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
            SellingPrice = dto.SellingPrice,
            SizeSellingPrices = dto.SizeSellingPrices
        };

        _context.Exports.Add(export);
        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(dto.SizeSellingPrices))
        {
            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(dto.SizeSellingPrices);
                if (dict != null)
                {
                    foreach (var kvp in dict)
                    {
                        var colorName = kvp.Key;
                        var sizes = kvp.Value;

                        var colorPrice = new ExportColorPrice
                        {
                            ExportId = export.Id,
                            ColorName = colorName,
                            Price6 = ParseDecimal(sizes, "6"),
                            Price7 = ParseDecimal(sizes, "7"),
                            Price8 = ParseDecimal(sizes, "8"),
                            Price9 = ParseDecimal(sizes, "9"),
                            Price10 = ParseDecimal(sizes, "10"),
                            Price10B = ParseDecimal(sizes, "10B"),
                            Price12 = ParseDecimal(sizes, "12"),
                            Price14 = ParseDecimal(sizes, "14"),
                            Price16 = ParseDecimal(sizes, "16"),
                            Price18 = ParseDecimal(sizes, "18"),
                            Price20 = ParseDecimal(sizes, "20"),
                            Price22 = ParseDecimal(sizes, "22"),
                            Price24 = ParseDecimal(sizes, "24"),
                            Price26 = ParseDecimal(sizes, "26"),
                            Price28 = ParseDecimal(sizes, "28"),
                            PriceBar = ParseDecimal(sizes, "Bar")
                        };
                        _context.ExportColorPrices.Add(colorPrice);
                    }
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // Ignored - SizeSellingPrices is invalid JSON
            }
        }

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
            SellingPrice = export.SellingPrice,
            SizeSellingPrices = export.SizeSellingPrices
        };

        return Ok(resultDto);
    }

    private decimal ParseDecimal(Dictionary<string, string> dict, string key)
    {
        if (dict != null && dict.TryGetValue(key, out var valStr) && decimal.TryParse(valStr, out var val))
        {
            return val;
        }
        return 0;
    }
}
