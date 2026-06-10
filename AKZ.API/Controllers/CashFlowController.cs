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
    public decimal RefinementFees { get; set; }
    public decimal SingleDoubleDrawnFees { get; set; }
    public decimal TotalFees => MessLabourFees + PurificationFees + RefinementFees + SingleDoubleDrawnFees;
    
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
            .ToListAsync();
        
        foreach (var record in processingRecords)
        {
            if (record.Workers != null && record.Workers.Count > 0)
            {
                foreach (var worker in record.Workers)
                {
                    if (worker.MessLabourWorker != null)
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

        // 2. Purification
        var purificationWorkers = await _context.PurificationWorkers
            .Include(pw => pw.Purifier)
            .Where(pw => pw.Purifier != null)
            .ToListAsync();
        foreach (var pw in purificationWorkers)
        {
            var cf = EnsureWorker(pw.Purifier!.Name);
            cf.PurificationFees += pw.WorkerFees;
        }

        // 3. Refinement
        var refinementRecords = await _context.RefinementRecords
            .Include(r => r.RefinementWorker)
            .Where(r => r.RefinementWorker != null)
            .ToListAsync();
        foreach (var r in refinementRecords)
        {
            var cf = EnsureWorker(r.RefinementWorker!.Name);
            cf.RefinementFees += r.WorkerFees;
        }

        // 4. Single & Double Drawn
        var sddRecords = await _context.SingleDoubleDrawnRecords
            .Include(s => s.Worker)
            .Where(s => s.Worker != null)
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