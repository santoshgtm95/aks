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
    /// </summary>
    [HttpGet("download-excel")]
    public async Task<IActionResult> DownloadExcelReport([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
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

        using var workbook = new XLWorkbook(reportPath);

        await PopulateWarehouseReportAsync(workbook, from, toExclusive);
        await PopulateRawMaterialReportAsync(workbook, from, toExclusive);
        await PopulateMessLabourReportAsync(workbook, from, toExclusive);
        await PopulatePurifiedStockReportAsync(workbook, from, toExclusive);
        await PopulateRefinedStockReportAsync(workbook, from, toExclusive);
        await PopulateSingleDoubleDrawnReportAsync(workbook, from, toExclusive);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        var downloadFileName = $"{fromDate:yyyy_MM_dd}_To_{toDate:yyyy_MM_dd}.xlsx";

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            downloadFileName);
    }

    private async Task PopulateWarehouseReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.Products
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive)
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

        WriteSheet(workbook, 1, "Warehouse Report", new[]
        {
         "Date", "Packages", "Marker", "Warehouse", "Unit", "Weight", "Price", "Currency", "Remaining Weight", "Status", "Create Date"
        }, records);
    }

    private async Task PopulateRawMaterialReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.Sales
            .Where(s => s.DeleteFlg == 0 && s.CreateDate >= from && s.CreateDate < toExclusive)
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

    private async Task PopulateMessLabourReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.ProcessingRecords
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive)
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

    private async Task PopulatePurifiedStockReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.PurifiedRecords
            .Where(p => p.DeleteFlg == 0 && p.CreateDate >= from && p.CreateDate < toExclusive)
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

    private async Task PopulateRefinedStockReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.RefinementRecords
            .Where(r => r.DeleteFlg == 0 && r.CreateDate >= from && r.CreateDate < toExclusive)
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

    private async Task PopulateSingleDoubleDrawnReportAsync(XLWorkbook workbook, DateTime from, DateTime toExclusive)
    {
        var records = await _context.SingleDoubleDrawnRecords
            .Where(s => s.DeleteFlg == 0 && s.CreateDate >= from && s.CreateDate < toExclusive)
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

        worksheet.Columns(1, headers.Count).AdjustToContents();
    }

    private static IXLWorksheet GetOrCreateWorksheet(XLWorkbook workbook, int position, string sheetName)
    {
        if (workbook.Worksheets.TryGetWorksheet(sheetName, out var existing))
        {
            return existing;
        }

        if (workbook.Worksheets.Count >= position)
        {
            var worksheet = workbook.Worksheet(position);
            worksheet.Name = sheetName;
            return worksheet;
        }

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
