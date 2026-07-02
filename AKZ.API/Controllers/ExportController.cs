using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using System.Text.Json;
using AKZ.API.Services;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly AKZDbContext _context;
    private readonly ChangeNotifierService _notifier;

    public ExportController(AKZDbContext context, ChangeNotifierService notifier)
    {
        _context = context;
        _notifier = notifier;
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
                var dict = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, JsonElement>>>(dto.SizeSellingPrices);
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
                            Price6 = ParseDecimalFromJson(sizes, "6", "price"),
                            Price7 = ParseDecimalFromJson(sizes, "7", "price"),
                            Price8 = ParseDecimalFromJson(sizes, "8", "price"),
                            Price9 = ParseDecimalFromJson(sizes, "9", "price"),
                            Price10 = ParseDecimalFromJson(sizes, "10", "price"),
                            Price10B = ParseDecimalFromJson(sizes, "10B", "price"),
                            Price12 = ParseDecimalFromJson(sizes, "12", "price"),
                            Price14 = ParseDecimalFromJson(sizes, "14", "price"),
                            Price16 = ParseDecimalFromJson(sizes, "16", "price"),
                            Price18 = ParseDecimalFromJson(sizes, "18", "price"),
                            Price20 = ParseDecimalFromJson(sizes, "20", "price"),
                            Price22 = ParseDecimalFromJson(sizes, "22", "price"),
                            Price24 = ParseDecimalFromJson(sizes, "24", "price"),
                            Price26 = ParseDecimalFromJson(sizes, "26", "price"),
                            Price28 = ParseDecimalFromJson(sizes, "28", "price"),
                            PriceBar = ParseDecimalFromJson(sizes, "Bar", "price"),

                            Weight6 = ParseDecimalFromJson(sizes, "6", "weight"),
                            Weight7 = ParseDecimalFromJson(sizes, "7", "weight"),
                            Weight8 = ParseDecimalFromJson(sizes, "8", "weight"),
                            Weight9 = ParseDecimalFromJson(sizes, "9", "weight"),
                            Weight10 = ParseDecimalFromJson(sizes, "10", "weight"),
                            Weight10B = ParseDecimalFromJson(sizes, "10B", "weight"),
                            Weight12 = ParseDecimalFromJson(sizes, "12", "weight"),
                            Weight14 = ParseDecimalFromJson(sizes, "14", "weight"),
                            Weight16 = ParseDecimalFromJson(sizes, "16", "weight"),
                            Weight18 = ParseDecimalFromJson(sizes, "18", "weight"),
                            Weight20 = ParseDecimalFromJson(sizes, "20", "weight"),
                            Weight22 = ParseDecimalFromJson(sizes, "22", "weight"),
                            Weight24 = ParseDecimalFromJson(sizes, "24", "weight"),
                            Weight26 = ParseDecimalFromJson(sizes, "26", "weight"),
                            Weight28 = ParseDecimalFromJson(sizes, "28", "weight"),
                            WeightBar = ParseDecimalFromJson(sizes, "Bar", "weight")
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

        _notifier.NotifyChange();

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

    private decimal ParseDecimalFromJson(Dictionary<string, JsonElement> sizes, string sizeKey, string propKey)
    {
        if (sizes != null && sizes.TryGetValue(sizeKey, out var valElement))
        {
            if (valElement.ValueKind == JsonValueKind.Object && valElement.TryGetProperty(propKey, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var dec))
                    return dec;
                if (prop.ValueKind == JsonValueKind.String && decimal.TryParse(prop.GetString(), out var strDec))
                    return strDec;
            }
            else if (propKey == "price") // fallback for old format where it was just text
            {
                if (valElement.ValueKind == JsonValueKind.Number && valElement.TryGetDecimal(out var dec))
                    return dec;
                if (valElement.ValueKind == JsonValueKind.String && decimal.TryParse(valElement.GetString(), out var strDec))
                    return strDec;
            }
        }
        return 0;
    }
}
