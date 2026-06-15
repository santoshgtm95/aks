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
    public decimal MessLabourFees { get; set; }
    public decimal PurificationFees { get; set; }
    public decimal PurificationSupervisorFees { get; set; }
    public decimal RefinementFees { get; set; }
    public decimal WashGradingFees { get; set; }
    public decimal SingleDoubleDrawnFees { get; set; }
    public decimal TotalFees => MessLabourFees + PurificationFees + PurificationSupervisorFees + RefinementFees + WashGradingFees + SingleDoubleDrawnFees;
    
    public decimal PaidAmount { get; set; }
    public decimal UnpaidAmount => TotalFees - PaidAmount;
}

public class MakePaymentDto
{
    public string WorkerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
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
    public async Task<ActionResult<IEnumerable<WorkerCashFlowDto>>> GetCashFlow()
    {
        var cashFlows = new Dictionary<string, WorkerCashFlowDto>();

        var EnsureWorker = (string name) => {
            if (string.IsNullOrWhiteSpace(name)) name = "Unknown";
            name = name.Trim();
            if (!cashFlows.ContainsKey(name)) {
                cashFlows[name] = new WorkerCashFlowDto { WorkerName = name };
            }
            return cashFlows[name];
        };

        // 1. Mess-Labour
        var processingRecords = await _context.ProcessingRecords
            .Include(r => r.Workers)
                .ThenInclude(w => w.MessLabourWorker)
            .Where(r => r.DeleteFlg == 0)
            .ToListAsync();
        
        foreach (var record in processingRecords)
        {
            if (record.Workers != null && record.Workers.Count > 0)
            {
                foreach (var worker in record.Workers)
                {
                    if (worker.MessLabourWorker != null && worker.MessLabourWorker.DeleteFlg == 0)
                    {
                        var cf = EnsureWorker(worker.MessLabourWorker.Name);
                        cf.MessLabourFees += worker.WorkerFee;
                    }
                }
            }
            else
            {
                // Fallback for legacy string-based workers if they exist and haven't been migrated
                if (string.IsNullOrWhiteSpace(record.WorkerNames)) continue;
                
                var names = record.WorkerNames.Split(',').Select(n => n.Trim()).Where(n => !string.IsNullOrEmpty(n)).ToList();
                if (names.Count == 0 || record.WorkerFees == 0) continue;

                var feePerWorker = record.WorkerFees / names.Count; 
                foreach (var name in names)
                {
                    var cf = EnsureWorker(name);
                    cf.MessLabourFees += feePerWorker;
                }
            }
        }

        // 2. Purification Worker Fees
        var purificationWorkers = await _context.PurificationWorkers
            .Include(pw => pw.Purifier)
            .Where(pw => pw.Purifier != null && pw.DeleteFlg == 0 && pw.Purifier.DeleteFlg == 0)
            .ToListAsync();
        foreach (var pw in purificationWorkers)
        {
            var cf = EnsureWorker(pw.Purifier!.Name);
            cf.PurificationFees += pw.WorkerFees;
        }

        // 2.5. Purification Supervisor Fees
        var purifiedRecords = await _context.PurifiedRecords
            .Include(pr => pr.Place)
            .Where(pr => pr.Place != null && pr.DeleteFlg == 0)
            .ToListAsync();
        foreach (var pr in purifiedRecords)
        {
            if (!string.IsNullOrEmpty(pr.Place!.SupervisorName))
            {
                var cf = EnsureWorker(pr.Place.SupervisorName);
                cf.PurificationSupervisorFees += pr.SupervisorFees;
            }
        }

        // 3. Refinement
        var refinementRecords = await _context.RefinementRecords
            .Include(r => r.RefinementWorker)
            .Where(r => r.RefinementWorker != null && r.DeleteFlg == 0 && r.RefinementWorker.DeleteFlg == 0)
            .ToListAsync();
        foreach (var r in refinementRecords)
        {
            var cf = EnsureWorker(r.RefinementWorker!.Name);
            cf.RefinementFees += r.WorkerFees;
        }

        // 3.5 Wash & Grading
        var washGradingRecords = await _context.WashGradingRecords
            .Include(r => r.WashGradingWorker)
            .Where(r => r.WashGradingWorker != null && r.DeleteFlg == 0 && r.WashGradingWorker.DeleteFlg == 0)
            .ToListAsync();
        foreach (var r in washGradingRecords)
        {
            var cf = EnsureWorker(r.WashGradingWorker!.Name);
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
            cf.SingleDoubleDrawnFees += r.WorkerFees;
        }

        // 5. Payments
        var payments = await _context.WorkerPayments.ToListAsync();
        foreach (var p in payments)
        {
            var cf = EnsureWorker(p.WorkerName);
            cf.PaidAmount += p.Amount;
        }

        return Ok(cashFlows.Values.OrderBy(c => c.WorkerName));
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