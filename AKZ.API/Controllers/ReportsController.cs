using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using AKZ.API.Data;
using AKZ.API.Services;
using AKZ.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AKZ.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly IWebHostEnvironment _environment;
    private readonly AKZDbContext _context;

    public ReportsController(ReportService reportService, IWebHostEnvironment environment, AKZDbContext context)
    {
        _reportService = reportService;
        _environment = environment;
        _context = context;
    }

    /// <summary>
    /// Get products (markers) created within a date range
    /// </summary>
    [HttpGet("markers-by-date")]
    public async Task<ActionResult<List<object>>> GetMarkersByDate([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        if (fromDate == default || toDate == default)
        {
            return BadRequest(new { message = "From date and to date are required" });
        }

        if (fromDate.Date > toDate.Date)
        {
            return BadRequest(new { message = "From date cannot be later than to date" });
        }

        try
        {
            var from = fromDate.Date;
            var toExclusive = toDate.Date.AddDays(1);

            var markers = await _context.Products
                .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive)
                .OrderBy(p => p.CreateDate)
                .Select(p => new
                {
                    p.Id,
                    MarkerName = p.Marker,
                    p.Date,
                    WarehouseName = p.Warehouse != null ? p.Warehouse.Name : "",
                    p.Weight
                })
                .ToListAsync();

            return Ok(markers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving markers by date", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all markers that have been exported
    /// </summary>
    [HttpGet("exported-markers")]
    public async Task<ActionResult<List<ExportedMarkerDto>>> GetExportedMarkers()
    {
        try
        {
            var markers = await _reportService.GetExportedMarkersAsync();
            return Ok(markers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving exported markers", error = ex.Message });
        }
    }

    /// <summary>
    /// Generate report data for selected markers
    /// </summary>
    [HttpPost("generate-report-data")]
    public async Task<ActionResult<ReportDataResponseDto>> GenerateReportData([FromBody] ReportDataRequestDto request)
    {
        if (request == null || request.MarkerIds == null || request.MarkerIds.Count == 0)
        {
            return BadRequest(new { message = "Please select at least one marker" });
        }

        if (request.ReportTypes == null || request.ReportTypes.Count == 0)
        {
            return BadRequest(new { message = "Please select at least one report type" });
        }

        try
        {
            var reportData = await _reportService.GenerateReportDataAsync(request);
            return Ok(reportData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error generating report data", error = ex.Message });
        }
    }

    /// <summary>
    /// Download the Excel report populated with date-filtered data.
    /// Only includes sheets for the selected report types.
    /// </summary>
    [HttpGet("download-excel")]
    public async Task<IActionResult> DownloadExcelReport(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] List<string>? reportTypes = null,
        [FromQuery] List<int>? markerIds = null,
        [FromQuery] List<int>? semiPurchaseIds = null)
    {
        if (fromDate == default || toDate == default)
        {
            return BadRequest(new { message = "From date and to date are required" });
        }

        if (fromDate.Date > toDate.Date)
        {
            return BadRequest(new { message = "From date cannot be later than to date" });
        }

        var reportPath = Path.Combine(_environment.ContentRootPath, "Report", "Report.xlsx");
        if (!System.IO.File.Exists(reportPath))
        {
            return NotFound(new { message = "Report.xlsx file was not found" });
        }

        var from = fromDate.Date;
        var toExclusive = toDate.Date.AddDays(1);
        var types = reportTypes ?? new List<string>();

        var sheetMapping = new Dictionary<string, string>
        {
            ["Inventory"] = "Warehouse Report",
            ["RawMaterialSales"] = "Raw Material Report",
            ["Washed"] = "Washed Report",
            ["MessLabour"] = "Mess Labour Report",
            ["PurifiedStock"] = "Purified Stock Report",
            ["RefinedStock"] = "Refined Stock Report",
            ["SingleDoubleDrawn"] = "Single & Double Drawn Report",
            ["ExportedReport"] = "Exported Report"
        };

        using var workbook = new XLWorkbook(reportPath);

        var ids = (markerIds != null && markerIds.Count > 0) ? markerIds : null;

        if (types.Count == 0 || types.Contains("Inventory"))
            await PopulateWarehouseReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("RawMaterialSales"))
            await PopulateRawMaterialReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("MessLabour"))
            await PopulateMessLabourReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("PurifiedStock"))
            await PopulatePurifiedStockReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("RefinedStock"))
            await PopulateRefinedStockReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("SingleDoubleDrawn"))
            await PopulateSingleDoubleDrawnReportAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("Washed"))
            await PopulateWashedAsync(workbook, from, toExclusive, ids);

        if (types.Count == 0 || types.Contains("ExportedReport"))
            await PopulateExportedReportAsync(workbook, from, toExclusive);

        if (semiPurchaseIds != null && semiPurchaseIds.Count > 0)
            await PopulateSemiExportPurchaseReportAsync(workbook, semiPurchaseIds);

        // Remove sheets that were not selected
        if (types.Count > 0)
        {
            var sheetsToRemove = sheetMapping
                .Where(kvp => !types.Contains(kvp.Key))
                .Select(kvp => kvp.Value)
                .ToList();

            foreach (var sheetName in sheetsToRemove)
            {
                if (workbook.Worksheets.TryGetWorksheet(sheetName, out var sheet))
                {
                    sheet.Delete();
                }
            }
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        var downloadFileName = $"{fromDate:yyyy_MM_dd}_To_{toDate:yyyy_MM_dd}.xlsx";

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            downloadFileName);
    }

    private async Task PopulateWarehouseReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.Products
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(p.Id)))
            .OrderBy(p => p.CreateDate)
            .Select(p => new object?[]
            {
                p.Date,
                p.Packages,
                p.Marker,
                p.Warehouse != null ? p.Warehouse.Name : "",
                p.Unit,
                p.Weight,
                p.Price,
                p.Currency,
                p.RemainingWeight,
                p.IsActive ? "Active" : "Inactive",
                p.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 1, "Inventory Report", new[]
        {
         "Date", "Packages", "Marker", "Warehouse", "Unit", "Weight", "Price", "Currency", "Remaining Weight", "Status", "Create Date"
        }, records);
    }

    private async Task PopulateRawMaterialReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.Sales
            .Where(s => s.DeleteFlg == 0 && s.CreateDate >= from && s.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(s.ProductId)))
            .OrderBy(s => s.CreateDate)
            .Select(s => new object?[]
            {

                s.Date,
                s.Product.Marker,
                s.Marker,
                s.Category,
                s.Unit,
                s.Weight,
                s.PlusMinusWeight,
                s.Price,
                s.Currency,
                s.TotalRemaining,
                s.CustomerName,
                s.CustomerContact,
                s.Remark,
                s.Seller.Username,
                s.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 2, "Raw Material Report", new[]
        {
            "Date", "Product Marker", "Sale Marker", "Category", "Unit", "Weight", "Plus/Minus Weight", "Price", "Currency", "Total Remaining", "Customer Name", "Customer Contact", "Remark", "Seller", "Create Date"
        }, records);
    }

    private async Task PopulateMessLabourReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.ProcessingRecords
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(p.ProductId)))
            .OrderBy(p => p.CreateDate)
            .Select(p => new object?[]
            {

                p.Date,
                p.Product.Marker,
                p.Product.Packages,
                p.WorkerNames,
                p.Count,
                p.UnitWeight,
                p.RedWeight,
                p.WhiteWeight,
                p.SpecialWeight,
                p.NaturalWeight,
                p.NaturalWhiteWeight,
                p.NaturalRedWeight,
                p.ShortCutWeight,
                p.ArtificialWeight,
                p.ShortWeight,
                p.LossWeight,
                p.TotalWeight,
                p.RemainingWeight,
                p.WorkerFees,
                p.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 3, "Mess Labour Report", new[]
        {
              "Date", "Marker", "Packages", "Workers", "Count", "Unit Weight", "Red Weight", "White Weight", "Special Weight", "Natural Weight", "Natural White Weight", "Natural Red Weight", "Short Cut Weight", "Artificial Weight", "Short Weight", "Loss Weight", "Total Weight", "Remaining Weight", "Worker Fees", "Create Date"
        }, records);
    }

    private async Task PopulatePurifiedStockReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.PurifiedRecords
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(p.ProcessingRecord.ProductId)))
            .OrderBy(p => p.CreateDate)
            .Select(p => new object?[]
            {

                p.Date,
                p.ProcessingRecord.Product.Marker,
                p.Category,
                p.Count,
                p.Weight,
                p.Place != null ? p.Place.Name : "",
                p.Purifier != null ? p.Purifier.Name : "",
                p.IsWeightFull ? "Full" : "Partial",
                p.RemainingCount,
                p.RemainingWeight,
                p.SupervisorFees,
                p.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 4, "Purified Stock Report", new[]
        {
           "Date", "Marker", "Category", "Count", "Weight", "Place", "Purifier", "Weight Status", "Remaining Count", "Remaining Weight", "Supervisor Fees", "Create Date"
        }, records);
    }

    private async Task PopulateRefinedStockReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.RefinementRecords
            .Where(r => r.DeleteFlg == 0 && r.CreateDate >= from && r.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(r.PurifiedRecord.ProcessingRecord.ProductId)))
            .OrderBy(r => r.CreateDate)
            .Select(r => new object?[]
            {

                r.Date,
                r.PurifiedRecord.ProcessingRecord.Product.Marker,
                r.Category,
                r.Count,
                r.Weight,
                r.RefinementWorker != null ? r.RefinementWorker.Name : "",
                r.LostWeight,
                r.SpoilageWeight,
                r.ReturnWeight,
                r.RemainingCount,
                r.RemainingWeight,
                r.WorkerFees,
                r.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 5, "Refined Stock Report", new[]
        {
            "Date", "Marker", "Category", "Count", "Weight", "Refinement Worker", "Lost Weight", "Spoilage Weight", "Return Weight", "Remaining Count", "Remaining Weight", "Worker Fees", "Create Date"
        }, records);
    }

    private async Task PopulateSingleDoubleDrawnReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.SingleDoubleDrawnRecords
            .Where(s => s.DeleteFlg == 0 && s.CreateDate >= from && s.CreateDate < toExclusive
                && (markerIds == null || markerIds.Contains(s.RefinementRecord.PurifiedRecord.ProcessingRecord.ProductId)))
            .OrderBy(s => s.CreateDate)
            .Select(s => new object?[]
            {

                s.Date,
                s.RefinementRecord.PurifiedRecord.ProcessingRecord.Product.Marker,
                s.RefinementRecord.Category,
                s.Worker != null ? s.Worker.Name : "",
                s.Size6,
                s.Size7,
                s.Size8,
                s.Size9,
                s.Size10,
                s.Size10B,
                s.Size12,
                s.Size14,
                s.Size16,
                s.Size18,
                s.Size20,
                s.Size22,
                s.Size24,
                s.Size26,
                s.Size28,
                s.SizeBar,
                s.LostWeight,
                s.SpoilageWeight,
                s.ReturnWeight,
                s.SingleDoubleLostWeight,
                s.WorkerFees,
                s.Note,
                s.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 6, "Single & Double Drawn Report", new[]
        {
             "Date", "Marker", "Category", "Worker", "Size 6", "Size 7", "Size 8", "Size 9", "Size 10", "Size 10B", "Size 12", "Size 14", "Size 16", "Size 18", "Size 20", "Size 22", "Size 24", "Size 26", "Size 28", "Size Bar", "Lost Weight", "Spoilage Weight", "Return Weight", "Single/Double Lost Weight", "Worker Fees", "Note", "Create Date"
        }, records);
    }

    private async Task PopulateWashedAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive, List<int>? markerIds = null)
    {
        var records = await _context.WashGradingRecords
            .Where(w => w.DeleteFlg == 0 && w.CreateDate >= from && w.CreateDate < toExclusive && w.WashGradingWorkerId != null
                && (markerIds == null || markerIds.Contains(w.ProductId)))
            .OrderBy(w => w.CreateDate)
            .Select(w => new object?[]
            {
                w.Date,
                w.Product.Marker,
                w.Product.Warehouse != null ? w.Product.Warehouse.Name : "",
                w.Worker != null ? w.Worker.Name : "",
                w.Weight,
                w.LostWeight,
                w.RemainingWeight,
                w.WorkerFees,
                w.CreateDate
            })
            .ToListAsync();

        WriteSheet(workbook, 7, "Washed Report", new[]
        {
            "Date", "Marker", "Warehouse", "Worker", "Weight", "Lost Weight", "Remaining Weight", "Worker Fees", "Create Date"
        }, records);
    }

    private async Task PopulateExportedReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var exports = await _context.Exports
            .Where(e => e.DeleteFlg == 0 && e.CreateDate >= from && e.CreateDate < toExclusive)
            .Include(e => e.Ledger)
            .Include(e => e.ExchangeRate)
            .Include(e => e.ColorPrices)
            .OrderBy(e => e.CreateDate)
            .ToListAsync();

        var records = new List<object?[]>();

        foreach (var exp in exports)
        {
            var exchangeRate = exp.ExchangeRate?.Rate ?? 0;

            if (exp.ColorPrices != null && exp.ColorPrices.Any())
            {
                foreach (var color in exp.ColorPrices.OrderBy(c => c.ColorName))
                {
                    records.Add(new object?[]
                    {
                        exp.Date,
                        exp.Ledger != null ? exp.Ledger.LedgerName : "",
                        color.ColorName,
                        color.Price6, color.Price7, color.Price8, color.Price9, color.Price10,
                        color.Price10B, color.Price12, color.Price14, color.Price16,
                        color.Price18, color.Price20, color.Price22, color.Price24,
                        color.Price26, color.Price28, color.PriceBar,
                        color.Weight6, color.Weight7, color.Weight8, color.Weight9, color.Weight10,
                        color.Weight10B, color.Weight12, color.Weight14, color.Weight16,
                        color.Weight18, color.Weight20, color.Weight22, color.Weight24,
                        color.Weight26, color.Weight28, color.WeightBar,
                        exp.CreateDate
                    });
                }
            }
            else
            {
                records.Add(new object?[]
                {
                    exp.Date,
                    exp.Ledger != null ? exp.Ledger.LedgerName : "",
                    "",
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0, (decimal)0,
                    (decimal)0, (decimal)0, (decimal)0,
                    exp.CreateDate
                });
            }
        }

        WriteSheet(workbook, 8, "Exported Report", new[]
        {
            "Date", "Ledger", "Color Name",
            "Price 6", "Price 7", "Price 8", "Price 9", "Price 10",
            "Price 10B", "Price 12", "Price 14", "Price 16",
            "Price 18", "Price 20", "Price 22", "Price 24",
            "Price 26", "Price 28", "Price Bar",
            "Weight 6", "Weight 7", "Weight 8", "Weight 9", "Weight 10",
            "Weight 10B", "Weight 12", "Weight 14", "Weight 16",
            "Weight 18", "Weight 20", "Weight 22", "Weight 24",
            "Weight 26", "Weight 28", "Weight Bar",
            "Create Date"
        }, records);
    }

    private async Task PopulateSemiExportPurchaseReportAsync(XLWorkbook workbook, List<int> semiPurchaseIds)
    {
        var records = await _context.SemiExportPurchaseRecords
            .Where(r => semiPurchaseIds.Contains(r.SemiExportPurchaseId))
            .Include(r => r.SemiExportPurchase)
            .Include(r => r.SemiExportPurchaseProcessing)
                .ThenInclude(p => p!.Worker)
            .OrderBy(r => r.SemiExportPurchaseId)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync();

        var rows = records.Select(r => new object?[]
        {
            // Purchase info
            r.SemiExportPurchase?.CustomerName ?? r.CustomerName,
            r.SemiExportPurchase?.Contact ?? r.Contact,
            r.SemiExportPurchase?.Color ?? r.Color,
            r.SemiExportPurchase?.ReceiveDateTime ?? r.ReceiveDateTime,
            r.SemiExportPurchase?.TotalReceiveWeight,
            // Processing info
            r.SemiExportPurchaseProcessing?.Worker?.Name ?? "",
            r.SemiExportPurchaseProcessing?.AssignWeight,
            r.SemiExportPurchaseProcessing?.LostWeight,
            r.SemiExportPurchaseProcessing?.Status ?? "",
            // Record details
            r.WorkerName,
            r.WorkerFees,
            r.ExchangeRateRate,
            r.AssignWeight,
            r.LostWeight,
            // Sizes
            r.Size6Weight,    r.Size6Price,
            r.Size7Weight,    r.Size7Price,
            r.Size8Weight,    r.Size8Price,
            r.Size9Weight,    r.Size9Price,
            r.Size10Weight,   r.Size10Price,
            r.Size10BWeight,  r.Size10BPrice,
            r.Size12Weight,   r.Size12Price,
            r.Size14Weight,   r.Size14Price,
            r.Size16Weight,   r.Size16Price,
            r.Size18Weight,   r.Size18Price,
            r.Size20Weight,   r.Size20Price,
            r.Size22Weight,   r.Size22Price,
            r.Size24Weight,   r.Size24Price,
            r.Size26Weight,   r.Size26Price,
            r.Size28Weight,   r.Size28Price,
            r.SizeBarWeight,  r.SizeBarPrice,
            r.ReturnWeight,   r.ReturnPrice,
            r.SpoilageWeight, r.SpoilagePrice,
            r.LostSizeWeight,
            r.CreatedAt
        }).ToList<object?[]>();

        WriteSheet(workbook, 9, "Semi Export Purchase Report", new[]
        {
            "Customer Name", "Contact", "Color", "Receive Date", "Total Receive Weight",
            "Processing Worker", "Processing Assign Weight", "Processing Lost Weight", "Processing Status",
            "Record Worker", "Worker Fees", "Exchange Rate", "Assign Weight", "Lost Weight",
            "Size 6 Weight", "Size 6 Price",
            "Size 7 Weight", "Size 7 Price",
            "Size 8 Weight", "Size 8 Price",
            "Size 9 Weight", "Size 9 Price",
            "Size 10 Weight", "Size 10 Price",
            "Size 10B Weight", "Size 10B Price",
            "Size 12 Weight", "Size 12 Price",
            "Size 14 Weight", "Size 14 Price",
            "Size 16 Weight", "Size 16 Price",
            "Size 18 Weight", "Size 18 Price",
            "Size 20 Weight", "Size 20 Price",
            "Size 22 Weight", "Size 22 Price",
            "Size 24 Weight", "Size 24 Price",
            "Size 26 Weight", "Size 26 Price",
            "Size 28 Weight", "Size 28 Price",
            "Size Bar Weight", "Size Bar Price",
            "Return Weight", "Return Price",
            "Spoilage Weight", "Spoilage Price",
            "Lost Size Weight",
            "Created At"
        }, rows);
    }

    private static void WriteSheet(XLWorkbook workbook, int position, string sheetName, IReadOnlyList<string> headers, IReadOnlyList<object?[]> rows)
    {
        var worksheet = GetOrCreateWorksheet(workbook, position, sheetName);
        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 1;
        if (lastRow >= 2)
        {
            worksheet.Rows(2, lastRow).Delete();
        }

        for (var col = 0; col < headers.Count; col++)
        {
            var cell = worksheet.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#EAF2FF");
        }

        for (var row = 0; row < rows.Count; row++)
        {
            var values = rows[row];
            for (var col = 0; col < headers.Count; col++)
            {
                SetCellValue(worksheet.Cell(row + 2, col + 1), col < values.Length ? values[col] : null);
            }
        }

        foreach (var col in worksheet.Columns(1, headers.Count))
        {
            col.AdjustToContents();
            col.Width = Math.Max(col.Width + 4, 12);
        }
    }

    private static IXLWorksheet GetOrCreateWorksheet(XLWorkbook workbook, int position, string sheetName)
    {
        if (workbook.Worksheets.TryGetWorksheet(sheetName, out var existing))
        {
            return existing;
        }

        // Try to reuse an existing sheet at the target position
        if (workbook.Worksheets.Count >= position)
        {
            var worksheet = workbook.Worksheet(position);
            // Only reuse if the sheet name doesn't match another known report sheet
            worksheet.Name = sheetName;
            return worksheet;
        }

        // Add a new sheet at the end
        return workbook.Worksheets.Add(sheetName);
    }

    private static void SetCellValue(IXLCell cell, object? value)
    {
        switch (value)
        {
            case null:
                cell.Clear(XLClearOptions.Contents);
                break;
            case DateTime dateTime:
                cell.Value = dateTime;
                cell.Style.DateFormat.Format = "yyyy-mm-dd";
                break;
            case decimal decimalValue:
                cell.Value = decimalValue;
                break;
            case double doubleValue:
                cell.Value = doubleValue;
                break;
            case int intValue:
                cell.Value = intValue;
                break;
            case bool boolValue:
                cell.Value = boolValue;
                break;
            default:
                cell.Value = value.ToString();
                break;
        }
    }
}
