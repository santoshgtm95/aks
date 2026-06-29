using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.Models;
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

    public CashFlowController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkerCashFlowDto>>> GetCashFlow([FromQuery] int? placeId = null)
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
            var messLabourEntries = await _context.ProcessingRecordWorkers.Include(w => w.Worker)
                                                  .Include(w => w.ProcessingRecord).ThenInclude(r => r.Product)
                                                  .Where(w => w.ProcessingRecord.DeleteFlg == 0 && w.Worker.DeleteFlg == 0)
                                                  .ToListAsync();

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
            .Where(pw => pw.Purifier != null && pw.DeleteFlg == 0 && pw.Purifier.DeleteFlg == 0);

        if (placeId.HasValue)
        {
            purificationWorkersQuery = purificationWorkersQuery.Where(pw => pw.PlaceId == placeId.Value);
        }

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
        {
            purifiedRecordsQuery = purifiedRecordsQuery.Where(pr => pr.PlaceId == placeId.Value);
        }

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
            var refinementRecords = await _context.RefinementRecords
                .Include(r => r.Worker)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0)
                .ToListAsync();
            foreach (var r in refinementRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.RefinementFees += r.WorkerFees;
            }

            // 3.5 Wash & Grading
            var washGradingRecords = await _context.WashGradingRecords
                .Include(r => r.Worker)
                .Where(r => r.Worker != null && r.DeleteFlg == 0 && r.Worker.DeleteFlg == 0)
                .ToListAsync();
            foreach (var r in washGradingRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.WashGradingFees += r.WorkerFees;
            }

            // 4. Single & Double Drawn
            var sddRecords = await _context.SingleDoubleDrawnRecords
                .Include(s => s.Worker)
                .Where(s => s.Worker != null && s.DeleteFlg == 0 && s.Worker.DeleteFlg == 0)
                .ToListAsync();
            foreach (var r in sddRecords)
            {
                var cf = EnsureWorker(r.Worker!.Name);
                cf.WorkerId ??= r.Worker.Id;
                cf.SingleDoubleDrawnFees += r.WorkerFees;
            }

            // 5. Semi Export Purchase
            var semiExportPurchaseRecords = await _context.SemiExportPurchaseRecords
                .Include(r => r.SemiExportPurchaseProcessing)
                    .ThenInclude(p => p!.Worker)
                .Where(r => r.WorkerFees > 0)
                .ToListAsync();
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

        return Ok(new { message = "Payment recorded successfully.", paymentId = payment.Id });
    }
}