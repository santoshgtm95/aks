using AKZ.API.Data;
using AKZ.API.Models;
using AKZ.API.Services;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace AKZ.API.Controllers;

public class WorkerCashFlowDto
{
    public string WorkerName { get; set; } = string.Empty;
    public int? WorkerId { get; set; }
    public int? PurifierId { get; set; }
    public string PlaceNames { get; set; } = string.Empty;
    public decimal MessLabourFees { get; set; }
    public decimal PurificationFees { get; set; }
    public decimal PurificationSupervisorFees { get; set; }
    public decimal RefinementFees { get; set; }
    public decimal WashGradingFees { get; set; }
    public decimal SingleDoubleDrawnFees { get; set; }
    public decimal SemiExportPurchaseFees { get; set; }
    public decimal TotalFees => MessLabourFees + PurificationFees + PurificationSupervisorFees + RefinementFees + WashGradingFees + SingleDoubleDrawnFees + SemiExportPurchaseFees;

    public decimal PaidAmount { get; set; }
    public decimal UnpaidAmount => TotalFees - PaidAmount;
}

public class MakePaymentDto
{
    public string WorkerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class WorkerFeeBreakdownItemDto
{
    public string Process { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public decimal Fees { get; set; }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CashFlowController : ControllerBase
{
    private readonly AKZDbContext _context;
    private readonly ChangeNotifierService _notifier;
    private readonly IWebHostEnvironment _environment;

    public CashFlowController(AKZDbContext context, ChangeNotifierService notifier, IWebHostEnvironment environment)
    {
        _context = context;
        _notifier = notifier;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkerCashFlowDto>>> GetCashFlow([FromQuery] int? placeId = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        var cashFlows = new Dictionary<string, WorkerCashFlowDto>();
        var workerPlaces = new Dictionary<string, HashSet<string>>();

        var EnsureWorker = (string name) =>
        {
            if (string.IsNullOrWhiteSpace(name)) name = "Unknown";
            name = name.Trim();
            if (!cashFlows.ContainsKey(name))
            {
                cashFlows[name] = new WorkerCashFlowDto { WorkerName = name };
                workerPlaces[name] = new HashSet<string>();
            }
            return cashFlows[name];
        };

        var AddPlace = (string workerName, string? placeName) =>
        {
            if (string.IsNullOrEmpty(placeName)) return;
            if (!workerPlaces.ContainsKey(workerName)) workerPlaces[workerName] = new HashSet<string>();
            workerPlaces[workerName].Add(placeName);
        };

        // 1. Mess-Labour
        if (!placeId.HasValue)
        {
            var messLabourQuery = _context.ProcessingRecordWorkers.Include(w => w.Worker)
                                                  .Include(w => w.ProcessingRecord).ThenInclude(r => r.Product)
                                                  .Where(w => w.ProcessingRecord.DeleteFlg == 0 && w.Worker.DeleteFlg == 0);
            if (fromDate.HasValue)
                messLabourQuery = messLabourQuery.Where(w => w.ProcessingRecord.Date >= fromDate.Value);
            if (toDate.HasValue)
                messLabourQuery = messLabourQuery.Where(w => w.ProcessingRecord.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            var messLabourEntries = await messLabourQuery.ToListAsync();

            foreach (var w in messLabourEntries)
            {
                var cf = EnsureWorker(w.Worker.Name);
                cf.WorkerId ??= w.Worker.Id;
                cf.MessLabourFees += w.WorkerFee;
            }
        }

        // 2. Purification Worker Fees
        var purificationWorkersQuery = _context.PurificationWorkers
            .Include(pw => pw.Purifier)
            .Include(pw => pw.Place)
            .Include(pw => pw.PurifiedRecord)
            .Where(pw => pw.Purifier != null && pw.DeleteFlg == 0 && pw.Purifier.DeleteFlg == 0);

        if (placeId.HasValue)
            purificationWorkersQuery = purificationWorkersQuery.Where(pw => pw.PlaceId == placeId.Value);
        if (fromDate.HasValue)
            purificationWorkersQuery = purificationWorkersQuery.Where(pw => pw.PurifiedRecord != null && pw.PurifiedRecord.Date >= fromDate.Value);
        if (toDate.HasValue)
            purificationWorkersQuery = purificationWorkersQuery.Where(pw => pw.PurifiedRecord != null && pw.PurifiedRecord.Date <= toDate.Value.AddDays(1).AddSeconds(-1));

        var purificationWorkers = await purificationWorkersQuery.ToListAsync();
        foreach (var pw in purificationWorkers)
        {
            var cf = EnsureWorker(pw.Purifier!.Name);
            cf.PurifierId ??= pw.Purifier.Id;
            cf.PurificationFees += pw.WorkerFees;
            AddPlace(cf.WorkerName, pw.Place?.Name);
        }

        // 2.5. Purification Supervisor Fees
        var purifiedRecordsQuery = _context.PurifiedRecords
            .Include(pr => pr.Place)
            .Where(pr => pr.Place != null && pr.DeleteFlg == 0);

        if (placeId.HasValue)
            purifiedRecordsQuery = purifiedRecordsQuery.Where(pr => pr.PlaceId == placeId.Value);
        if (fromDate.HasValue)
            purifiedRecordsQuery = purifiedRecordsQuery.Where(pr => pr.Date >= fromDate.Value);
        if (toDate.HasValue)
            purifiedRecordsQuery = purifiedRecordsQuery.Where(pr => pr.Date <= toDate.Value.AddDays(1).AddSeconds(-1));

        var purifiedRecords = await purifiedRecordsQuery.ToListAsync();
        foreach (var pr in purifiedRecords)
        {
            if (!string.IsNullOrEmpty(pr.Place!.SupervisorName))
            {
                var cf = EnsureWorker(pr.Place.SupervisorName);
                cf.PurificationSupervisorFees += pr.SupervisorFees;
                AddPlace(cf.WorkerName, pr.Place.Name);
            }
        }

        if (!placeId.HasValue)
        {
            // 3. Refinement
            var refinementQuery = _context.RefinementRecords
                .Include(r => r.Worker)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0);
            if (fromDate.HasValue) refinementQuery = refinementQuery.Where(r => r.Date >= fromDate.Value);
            if (toDate.HasValue) refinementQuery = refinementQuery.Where(r => r.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            var refinementRecords = await refinementQuery.ToListAsync();
            foreach (var r in refinementRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.RefinementFees += r.WorkerFees;
            }

            // 3.5 Wash & Grading
            var washGradingQuery = _context.WashGradingRecords
                .Include(r => r.Worker)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0);
            if (fromDate.HasValue) washGradingQuery = washGradingQuery.Where(r => r.Date >= fromDate.Value);
            if (toDate.HasValue) washGradingQuery = washGradingQuery.Where(r => r.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            var washGradingRecords = await washGradingQuery.ToListAsync();
            foreach (var r in washGradingRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.WashGradingFees += r.WorkerFees;
            }

            // 4. Single & Double Drawn
            var sddQuery = _context.SingleDoubleDrawnRecords
                .Include(s => s.Worker)
                .Where(s => s.Worker != null && s.DeleteFlg == 0 && s.Worker.DeleteFlg == 0);
            if (fromDate.HasValue) sddQuery = sddQuery.Where(s => s.Date >= fromDate.Value);
            if (toDate.HasValue) sddQuery = sddQuery.Where(s => s.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            var sddRecords = await sddQuery.ToListAsync();
            foreach (var r in sddRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.SingleDoubleDrawnFees += r.WorkerFees;
            }

            // 5. Semi Export Purchase
            var semiExportPurchaseQuery = _context.SemiExportPurchaseRecords
                .Include(r => r.SemiExportPurchaseProcessing)
                    .ThenInclude(p => p!.Worker)
                .Where(r => r.WorkerFees > 0);
            if (fromDate.HasValue) semiExportPurchaseQuery = semiExportPurchaseQuery.Where(r => r.CreatedAt >= fromDate.Value);
            if (toDate.HasValue) semiExportPurchaseQuery = semiExportPurchaseQuery.Where(r => r.CreatedAt <= toDate.Value.AddDays(1).AddSeconds(-1));
            var semiExportPurchaseRecords = await semiExportPurchaseQuery.ToListAsync();
            foreach (var r in semiExportPurchaseRecords)
            {
                var worker = r.SemiExportPurchaseProcessing?.Worker;
                var workerName = worker?.Name ?? (string.IsNullOrWhiteSpace(r.WorkerName) ? null : r.WorkerName);
                var cf = EnsureWorker(workerName ?? "Unknown");
                if (worker != null) cf.WorkerId ??= worker.Id;
                cf.SemiExportPurchaseFees += r.WorkerFees;
            }
        }

        // 5. Payments
        var payments = await _context.WorkerPayments.ToListAsync();
        foreach (var p in payments)
        {
            var name = p.WorkerName.Trim();
            if (cashFlows.ContainsKey(name))
            {
                cashFlows[name].PaidAmount += p.Amount;
            }
            else if (!placeId.HasValue)
            {
                var cf = EnsureWorker(name);
                cf.PaidAmount += p.Amount;
            }
        }

        // Finalize PlaceNames
        foreach (var kvp in workerPlaces)
        {
            if (cashFlows.ContainsKey(kvp.Key))
            {
                cashFlows[kvp.Key].PlaceNames = string.Join(", ", kvp.Value);
            }
        }

        return Ok(cashFlows.Values.Where(c => c.TotalFees != 0 || c.PaidAmount != 0).OrderBy(c => c.WorkerName));
    }

    [HttpGet("breakdown")]
    public async Task<ActionResult<IEnumerable<WorkerFeeBreakdownItemDto>>> GetBreakdown(
        [FromQuery] int? workerId,
        [FromQuery] int? purifierId,
        [FromQuery] string? workerName)
    {
        if (!workerId.HasValue && !purifierId.HasValue && string.IsNullOrWhiteSpace(workerName))
            return BadRequest("workerId, purifierId, or workerName is required.");

        var items = new List<WorkerFeeBreakdownItemDto>();

        if (workerId.HasValue)
        {
            // 1. Mess-Labour
            var messLabourBreakdown = await _context.ProcessingRecordWorkers
                .Include(w => w.Worker)
                .Include(w => w.ProcessingRecord).ThenInclude(r => r.Product)
                .Where(w => w.MessLabourWorkerId == workerId.Value)
                .ToListAsync();
            foreach (var w in messLabourBreakdown)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Mess-Labour",
                    Reference = w.ProcessingRecord?.Product?.Marker ?? "-",
                    Date = w.ProcessingRecord?.Date,
                    Fees = w.WorkerFee
                });
            }

            // 3. Purification Supervisor (stored as name in Place — resolve via worker name)
            var supervisorWorker = await _context.Workers.FindAsync(workerId.Value);
            if (supervisorWorker != null)
            {
                var supervisorRecords = await _context.PurifiedRecords
                    .Include(r => r.Place)
                    .Where(r => r.Place != null && r.Place.SupervisorName == supervisorWorker.Name && r.SupervisorFees > 0)
                    .ToListAsync();
                foreach (var r in supervisorRecords)
                {
                    items.Add(new WorkerFeeBreakdownItemDto
                    {
                        Process = "Purification Supervisor",
                        Reference = r.Place?.Name ?? "-",
                        Date = r.Date,
                        Fees = r.SupervisorFees
                    });
                }
            }

            // 4. Refinement
            var refinementRecords = await _context.RefinementRecords
                .Include(r => r.Worker)
                .Include(r => r.PurifiedRecord)
                    .ThenInclude(pr => pr!.ProcessingRecord)
                        .ThenInclude(pr2 => pr2!.Product)
                .Where(r => r.Worker != null && r.Worker.Id == workerId.Value)
                .ToListAsync();
            foreach (var r in refinementRecords)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Refinement",
                    Reference = r.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "-",
                    Date = r.Date,
                    Fees = r.WorkerFees
                });
            }

            // 5. Wash & Grading
            var washGradingRecords = await _context.WashGradingRecords
                .Include(r => r.Worker)
                .Include(r => r.Product)
                .Where(r => r.Worker != null && r.Worker.Id == workerId.Value)
                .ToListAsync();
            foreach (var r in washGradingRecords)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Wash & Grading",
                    Reference = r.Product?.Marker ?? "-",
                    Date = r.Date,
                    Fees = r.WorkerFees
                });
            }

            // 6. Single & Double Drawn
            var sddRecords = await _context.SingleDoubleDrawnRecords
                .Include(r => r.Worker)
                .Include(r => r.RefinementRecord)
                    .ThenInclude(rr => rr!.PurifiedRecord)
                        .ThenInclude(pr => pr!.ProcessingRecord)
                            .ThenInclude(pr2 => pr2!.Product)
                .Where(r => r.Worker != null && r.Worker.Id == workerId.Value)
                .ToListAsync();
            foreach (var r in sddRecords)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Single & Double Drawn",
                    Reference = r.RefinementRecord?.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "-",
                    Date = r.Date,
                    Fees = r.WorkerFees
                });
            }

            // 7. Semi Export Purchase
            var semiExportRecords = await _context.SemiExportPurchaseRecords
                .Include(r => r.SemiExportPurchaseProcessing)
                .Where(r => r.WorkerFees > 0 && r.SemiExportPurchaseProcessing!.WorkerId == workerId.Value)
                .ToListAsync();
            foreach (var r in semiExportRecords)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Semi Export Purchase",
                    Reference = r.CustomerName,
                    Date = r.CreatedAt,
                    Fees = r.WorkerFees
                });
            }
        }

        if (purifierId.HasValue)
        {
            // 2. Purification
            var purificationWorkers = await _context.PurificationWorkers
                .Include(pw => pw.Purifier)
                .Include(pw => pw.PurifiedRecord)
                .Include(pw => pw.Place)
                .Where(pw => pw.PurifierId == purifierId.Value && pw.Purifier != null && pw.Purifier.DeleteFlg == 0)
                .ToListAsync();
            foreach (var pw in purificationWorkers)
            {
                items.Add(new WorkerFeeBreakdownItemDto
                {
                    Process = "Purification",
                    Reference = pw.Place?.Name ?? "-",
                    Date = pw.PurifiedRecord?.Date,
                    Fees = pw.WorkerFees
                });
            }
        }

        return Ok(items.OrderByDescending(i => i.Date));
    }

    [HttpGet("download-excel")]
    public async Task<IActionResult> DownloadCashFlowExcel(
        [FromQuery] int? placeId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var reportPath = Path.Combine(_environment.ContentRootPath, "Report", "Report.xlsx");
        if (!System.IO.File.Exists(reportPath))
            return NotFound(new { message = "Report.xlsx file was not found" });

        // ── Collect all breakdown items (same queries as GetCashFlow + GetBreakdown) ──
        var rows = new List<object?[]>();

        // 1. Mess-Labour
        var messQ = _context.ProcessingRecordWorkers
            .Include(w => w.Worker)
            .Include(w => w.ProcessingRecord).ThenInclude(r => r.Product)
            .Where(w => w.ProcessingRecord.DeleteFlg == 0 && w.Worker.DeleteFlg == 0 && w.WorkerFee > 0);
        if (!placeId.HasValue)
        {
            if (fromDate.HasValue) messQ = messQ.Where(w => w.ProcessingRecord.Date >= fromDate.Value);
            if (toDate.HasValue)   messQ = messQ.Where(w => w.ProcessingRecord.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            foreach (var w in await messQ.ToListAsync())
                rows.Add(new object?[] { w.Worker.Name, "Mess-Labour", w.ProcessingRecord?.Product?.Marker ?? "-", w.ProcessingRecord?.Date, w.WorkerFee });
        }

        // 2. Purification Worker Fees
        var purWQ = _context.PurificationWorkers
            .Include(pw => pw.Purifier).Include(pw => pw.Place).Include(pw => pw.PurifiedRecord)
            .Where(pw => pw.Purifier != null && pw.DeleteFlg == 0 && pw.Purifier.DeleteFlg == 0 && pw.WorkerFees > 0);
        if (placeId.HasValue) purWQ = purWQ.Where(pw => pw.PlaceId == placeId.Value);
        if (fromDate.HasValue) purWQ = purWQ.Where(pw => pw.PurifiedRecord != null && pw.PurifiedRecord.Date >= fromDate.Value);
        if (toDate.HasValue)   purWQ = purWQ.Where(pw => pw.PurifiedRecord != null && pw.PurifiedRecord.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
        foreach (var pw in await purWQ.ToListAsync())
            rows.Add(new object?[] { pw.Purifier!.Name, "Purification", pw.Place?.Name ?? "-", pw.PurifiedRecord?.Date, pw.WorkerFees });

        // 3. Purification Supervisor Fees
        var purRQ = _context.PurifiedRecords
            .Include(pr => pr.Place)
            .Where(pr => pr.Place != null && pr.DeleteFlg == 0 && pr.SupervisorFees > 0);
        if (placeId.HasValue) purRQ = purRQ.Where(pr => pr.PlaceId == placeId.Value);
        if (fromDate.HasValue) purRQ = purRQ.Where(pr => pr.Date >= fromDate.Value);
        if (toDate.HasValue)   purRQ = purRQ.Where(pr => pr.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
        foreach (var pr in await purRQ.ToListAsync())
            if (!string.IsNullOrEmpty(pr.Place!.SupervisorName))
                rows.Add(new object?[] { pr.Place.SupervisorName, "Purification Supervisor", pr.Place.Name, pr.Date, pr.SupervisorFees });

        if (!placeId.HasValue)
        {
            // 4. Refinement
            var refQ = _context.RefinementRecords
                .Include(r => r.Worker).Include(r => r.PurifiedRecord).ThenInclude(pr => pr!.ProcessingRecord).ThenInclude(pr2 => pr2!.Product)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0 && r.WorkerFees > 0);
            if (fromDate.HasValue) refQ = refQ.Where(r => r.Date >= fromDate.Value);
            if (toDate.HasValue)   refQ = refQ.Where(r => r.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            foreach (var r in await refQ.ToListAsync())
                rows.Add(new object?[] { r.Worker!.Name, "Refinement", r.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "-", r.Date, r.WorkerFees });

            // 5. Wash & Grading
            var washQ = _context.WashGradingRecords
                .Include(r => r.Worker).Include(r => r.Product)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0 && r.WorkerFees > 0);
            if (fromDate.HasValue) washQ = washQ.Where(r => r.Date >= fromDate.Value);
            if (toDate.HasValue)   washQ = washQ.Where(r => r.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            foreach (var r in await washQ.ToListAsync())
                rows.Add(new object?[] { r.Worker!.Name, "Wash & Grading", r.Product?.Marker ?? "-", r.Date, r.WorkerFees });

            // 6. Single & Double Drawn
            var sddQ = _context.SingleDoubleDrawnRecords
                .Include(s => s.Worker)
                .Include(s => s.RefinementRecord).ThenInclude(rr => rr!.PurifiedRecord).ThenInclude(pr => pr!.ProcessingRecord).ThenInclude(pr2 => pr2!.Product)
                .Where(s => s.Worker != null && s.DeleteFlg == 0 && s.Worker.DeleteFlg == 0 && s.WorkerFees > 0);
            if (fromDate.HasValue) sddQ = sddQ.Where(s => s.Date >= fromDate.Value);
            if (toDate.HasValue)   sddQ = sddQ.Where(s => s.Date <= toDate.Value.AddDays(1).AddSeconds(-1));
            foreach (var r in await sddQ.ToListAsync())
                rows.Add(new object?[] { r.Worker!.Name, "Single & Double Drawn", r.RefinementRecord?.PurifiedRecord?.ProcessingRecord?.Product?.Marker ?? "-", r.Date, r.WorkerFees });

            // 7. Semi Export Purchase
            var sepQ = _context.SemiExportPurchaseRecords
                .Include(r => r.SemiExportPurchaseProcessing).ThenInclude(p => p!.Worker)
                .Where(r => r.WorkerFees > 0);
            if (fromDate.HasValue) sepQ = sepQ.Where(r => r.CreatedAt >= fromDate.Value);
            if (toDate.HasValue)   sepQ = sepQ.Where(r => r.CreatedAt <= toDate.Value.AddDays(1).AddSeconds(-1));
            foreach (var r in await sepQ.ToListAsync())
            {
                var wName = r.SemiExportPurchaseProcessing?.Worker?.Name ?? r.WorkerName ?? "Unknown";
                rows.Add(new object?[] { wName, "Semi Export Purchase", r.CustomerName ?? "-", r.CreatedAt, r.WorkerFees });
            }
        }

        rows = rows.OrderBy(r => r[3]).ToList(); // sort by date

        using var workbook = new XLWorkbook(reportPath);
        var ws = workbook.Worksheets.Add("Cash Flow Fee Breakdown");

        // Header
        var headers = new[] { "Worker Name", "Fee Breakdown Process", "Marker / Reference", "datetime", "Fees (MMK)" };
        for (var c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#EAF2FF");
        }

        // Rows
        for (var r = 0; r < rows.Count; r++)
        {
            var vals = rows[r];
            for (var c = 0; c < headers.Length; c++)
            {
                var cell = ws.Cell(r + 2, c + 1);
                var val = c < vals.Length ? vals[c] : null;
                if (val is DateTime dt) { cell.Value = dt; cell.Style.DateFormat.Format = "yyyy-mm-dd hh:mm"; }
                else if (val is decimal dec) cell.Value = dec;
                else if (val != null) cell.Value = val.ToString();
            }
        }

        foreach (var col in ws.Columns(1, headers.Length))
        {
            col.AdjustToContents();
            col.Width = Math.Max(col.Width + 4, 14);
        }

        // Remove all other sheets (keep only Cash Flow sheet)
        var toDelete = workbook.Worksheets.Where(s => s.Name != "Cash Flow Fee Breakdown").Select(s => s.Name).ToList();
        foreach (var name in toDelete)
            if (workbook.Worksheets.TryGetWorksheet(name, out var s)) s.Delete();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        var label = fromDate.HasValue && toDate.HasValue
            ? $"CashFlow_{fromDate:yyyy_MM_dd}_To_{toDate:yyyy_MM_dd}.xlsx"
            : "CashFlow_All.xlsx";

        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            label);
    }

    [HttpPost("pay")]
    public async Task<ActionResult> MakePayment([FromBody] MakePaymentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.WorkerName) || dto.Amount <= 0)
        {
            return BadRequest("Invalid payment data.");
        }

        var payment = new WorkerPayment
        {
            WorkerName = dto.WorkerName,
            Amount = dto.Amount,
            PaymentDate = DateTime.UtcNow,
            Note = dto.Note,
            CreateBy = User.Identity?.Name ?? "system",
            CreateDate = DateTime.UtcNow,
            UpdateBy = User.Identity?.Name ?? "system",
            UpdateDate = DateTime.UtcNow
        };

        _context.WorkerPayments.Add(payment);
        await _context.SaveChangesAsync();
        _notifier.NotifyChange();

        return Ok(new { message = "Payment recorded successfully.", paymentId = payment.Id });
    }
}