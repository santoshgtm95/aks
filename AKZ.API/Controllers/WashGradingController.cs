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
public class WashGradingController : ControllerBase
{
    private readonly AKZDbContext _context;

    public WashGradingController(AKZDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null;
        return int.TryParse(claim, out var id) ? id : null;
    }

    // GET /api/washgrading/available-for-messlabour
    // Returns WashGradingRecords that still have RemainingWeight > 0 (not yet fully consumed by Mess Labour)
    [HttpGet("available-for-messlabour")]
    public async Task<ActionResult<List<WashGradingRecordDto>>> GetAvailableForMessLabour()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.WashGradingRecords
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(r => r.WashGradingWorker)
            .Where(r => r.DeleteFlg == 0 && r.RemainingWeight > 0.0001m)
            .Where(r => warehouseId == null || r.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = records.Where(r => r.Product != null).Select(r => new WashGradingRecordDto
        {
            Id = r.Id,
            Date = r.Date,
            ProductId = r.ProductId,
            ProductMarker = r.Product.Marker,
            Weight = r.Weight,
            WarehouseName = r.Product.Warehouse?.Name ?? "",
            WarehouseId = r.Product.WarehouseId,
            WashGradingWorkerId = r.WashGradingWorkerId,
            WashGradingWorkerName = r.WashGradingWorker?.Name ?? "",
            LostWeight = r.LostWeight,
            WorkerFees = r.WorkerFees,
            RemainingWeight = r.RemainingWeight,
            Unit = r.Product.Unit ?? "viss"
        }).ToList();

        return Ok(result);
    }

    // GET /api/washgrading/available-products
    [HttpGet("available-products")]
    public async Task<ActionResult<List<AvailableProductDto>>> GetAvailableProducts()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var products = await _context.Products
            .Include(p => p.Warehouse)
            .Where(p => p.IsActive && p.RemainingWeight > 0.0001m)
            .Where(p => warehouseId == null || p.WarehouseId == warehouseId)
            .OrderByDescending(p => p.Date)
            .Select(p => new AvailableProductDto
            {
                ProductId = p.Id,
                ProductMarker = p.Marker,
                WarehouseName = p.Warehouse != null ? p.Warehouse.Name : "",
                WarehouseId = p.WarehouseId,
                RemainingWeight = p.RemainingWeight,
                Unit = p.Unit
            })
            .ToListAsync();

        return Ok(products);
    }

    // GET /api/washgrading
    // Returns WashGradingProcesses that are still active (assigned weight > consumed weight)
    [HttpGet]
    public async Task<ActionResult<List<WashGradingProcessDto>>> GetProcesses()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var processes = await _context.WashGradingProcesses
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(r => r.WashGradingWorker)
            .Include(r => r.WashGradingRecords)
            .Where(r => r.DeleteFlg == 0)
            .Where(r => warehouseId == null || r.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<WashGradingProcessDto>();

        foreach (var r in processes)
        {
            decimal totalAssigned = r.Weight;
            decimal totalConsumed = r.WashGradingRecords
                .Where(rr => rr.DeleteFlg == 0)
                .Sum(rr => rr.Weight + rr.LostWeight);

            decimal remainingWeight = totalAssigned - totalConsumed;
            if (remainingWeight <= 0.001m) continue;

            string warehouseName = r.Product?.Warehouse?.Name ?? "";

            result.Add(new WashGradingProcessDto
            {
                Id = r.Id,
                Date = r.Date,
                ProductId = r.ProductId,
                ProductMarker = r.Product?.Marker ?? "",
                Weight = remainingWeight,
                RemainingWeightAfter = r.RemainingWeightAfter,
                WarehouseName = warehouseName,
                WarehouseId = r.Product?.WarehouseId,
                WashGradingWorkerId = r.WashGradingWorkerId,
                WashGradingWorkerName = r.WashGradingWorker?.Name ?? "",
                WorkerFees = r.WorkerFees
            });
        }

        return Ok(result);
    }

    // GET /api/washgrading/records
    [HttpGet("records")]
    public async Task<ActionResult<List<WashGradingRecordDto>>> GetRecords()
    {
        var warehouseId = GetCurrentUserWarehouseId();

        var records = await _context.WashGradingRecords
            .Include(r => r.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(r => r.WashGradingWorker)
            .Where(r => r.DeleteFlg == 0)
            .Where(r => warehouseId == null || r.Product.WarehouseId == warehouseId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        var result = new List<WashGradingRecordDto>();

        foreach (var r in records)
        {
            if (r.Product == null) continue;

            string warehouseName = r.Product.Warehouse?.Name ?? "";
            if (string.IsNullOrEmpty(warehouseName) && r.Product.WarehouseId.HasValue)
            {
                var warehouse = await _context.Warehouses.FindAsync(r.Product.WarehouseId.Value);
                if (warehouse != null) warehouseName = warehouse.Name;
            }

            result.Add(new WashGradingRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                ProductId = r.ProductId,
                ProductMarker = r.Product.Marker,
                Weight = r.Weight,
                WarehouseName = warehouseName,
                WarehouseId = r.Product.WarehouseId,
                WashGradingWorkerId = r.WashGradingWorkerId,
                WashGradingWorkerName = r.WashGradingWorker?.Name ?? "",
                LostWeight = r.LostWeight,
                WorkerFees = r.WorkerFees,
                RemainingWeight = r.RemainingWeight,
                Unit = r.Product.Unit ?? "viss",
                IsUsedInMessLabour = await _context.ProcessingRecords
                    .AnyAsync(pr => pr.WashGradingRecordId == r.Id && pr.DeleteFlg == 0)
            });
        }

        return Ok(result);
    }

    // POST /api/washgrading
    [HttpPost]
    public async Task<ActionResult<WashGradingProcessDto>> CreateProcess([FromBody] CreateWashGradingProcessDto dto)
    {
        var product = await _context.Products
            .Include(p => p.Warehouse)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId);

        if (product == null) return BadRequest(new { message = "Product not found" });

        // Convert viss to KG if product unit is KG
        string productUnit = (product.Unit ?? "").ToLower().Trim();
        bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
        decimal weightInProductUnit = isProductKg ? dto.Weight * 1.633m : dto.Weight;

        if (weightInProductUnit > product.RemainingWeight)
            return BadRequest(new { message = $"လက်ကျန် မလုံလောက်ပါ (ကျန်: {product.RemainingWeight})" });

        product.RemainingWeight -= weightInProductUnit;
        if (Math.Abs(product.RemainingWeight) < 0.0001m)
        {
            product.RemainingWeight = 0;
        }

        var process = new WashGradingProcess
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProductId = dto.ProductId,
            Weight = dto.Weight,
            RemainingWeightAfter = product.RemainingWeight,
            WashGradingWorkerId = dto.WashGradingWorkerId
        };

        _context.WashGradingProcesses.Add(process);
        await _context.SaveChangesAsync();

        string warehouseName = product.Warehouse?.Name ?? "";

        return Ok(new WashGradingProcessDto
        {
            Id = process.Id,
            Date = process.Date,
            ProductId = process.ProductId,
            ProductMarker = product.Marker,
            Weight = process.Weight,
            RemainingWeightAfter = process.RemainingWeightAfter,
            WarehouseName = warehouseName,
            WashGradingWorkerId = process.WashGradingWorkerId,
            WashGradingWorkerName = ""
        });
    }

    // PUT /api/washgrading/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProcess(int id, [FromBody] CreateWashGradingProcessDto dto)
    {
        var process = await _context.WashGradingProcesses
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (process == null) return NotFound();

        var record = new WashGradingRecord
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProductId = process.ProductId,
            Weight = dto.Weight,
            LostWeight = dto.LostWeight,
            RemainingWeight = dto.Weight,
            WashGradingWorkerId = dto.WashGradingWorkerId,
            WashGradingProcessId = id,
            WorkerFees = dto.WorkerFees
        };
        _context.WashGradingRecords.Add(record);

        process.WorkerFees = dto.WorkerFees;

        // Inventory reconciliation:
        // Adjust product remaining weight based on the difference between initially assigned weight
        // and final completed weight (Weight + LostWeight).
        decimal diff = process.Weight - (dto.Weight + dto.LostWeight);
        if (Math.Abs(diff) > 0.0001m)
        {
            var product = process.Product;
            if (product != null)
            {
                string productUnit = (product.Unit ?? "").ToLower().Trim();
                bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
                decimal diffInProductUnit = isProductKg ? diff * 1.633m : diff;

                product.RemainingWeight += diffInProductUnit;
                if (Math.Abs(product.RemainingWeight) < 0.0001m)
                {
                    product.RemainingWeight = 0;
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/washgrading/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcess(int id)
    {
        var process = await _context.WashGradingProcesses
            .Include(r => r.Product)
            .Include(r => r.WashGradingRecords)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (process == null) return NotFound();

        // Restore deducted weight to the product
        var product = process.Product;
        if (product != null)
        {
            string productUnit = (product.Unit ?? "").ToLower().Trim();
            bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
            decimal weightInProductUnit = isProductKg ? process.Weight * 1.633m : process.Weight;

            // Also account for completed records that might have already reconciled
            decimal totalConsumed = process.WashGradingRecords
                .Where(rr => rr.DeleteFlg == 0)
                .Sum(rr => rr.Weight + rr.LostWeight);
            decimal remainingUnconsumed = process.Weight - totalConsumed;

            if (remainingUnconsumed > 0)
            {
                decimal unconsumedInProductUnit = isProductKg ? remainingUnconsumed * 1.633m : remainingUnconsumed;
                product.RemainingWeight += unconsumedInProductUnit;
            }
        }

        // Remove linked WashGradingRecords
        foreach (var rec in process.WashGradingRecords.Where(r => r.DeleteFlg == 0))
        {
            _context.WashGradingRecords.Remove(rec);
        }

        _context.WashGradingProcesses.Remove(process);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/washgrading/records/{id}
    [HttpPut("records/{id}")]
    public async Task<IActionResult> UpdateRecord(int id, [FromBody] CreateWashGradingProcessDto dto)
    {
        var record = await _context.WashGradingRecords
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null) return NotFound();

        // Inventory adjustment for editing a completed record:
        // We compare the old consumed weight (record.Weight + record.LostWeight) with the new consumed weight (dto.Weight + dto.LostWeight).
        decimal oldConsumed = record.Weight + record.LostWeight;
        decimal newConsumed = dto.Weight + dto.LostWeight;
        decimal diff = oldConsumed - newConsumed;

        record.Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay);
        record.Weight = dto.Weight;
        record.LostWeight = dto.LostWeight;
        record.RemainingWeight = dto.Weight;
        record.WashGradingWorkerId = dto.WashGradingWorkerId;
        record.WorkerFees = dto.WorkerFees;

        // Sync process if exists
        if (record.WashGradingProcessId.HasValue)
        {
            var process = await _context.WashGradingProcesses.FindAsync(record.WashGradingProcessId.Value);
            if (process != null)
            {
                process.Date = record.Date;
                process.Weight = dto.Weight; // Keep it aligned
                process.WashGradingWorkerId = dto.WashGradingWorkerId;
                process.WorkerFees = dto.WorkerFees;
            }
        }

        if (Math.Abs(diff) > 0.0001m && record.Product != null)
        {
            string productUnit = (record.Product.Unit ?? "").ToLower().Trim();
            bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
            decimal diffInProductUnit = isProductKg ? diff * 1.633m : diff;

            record.Product.RemainingWeight += diffInProductUnit;
            if (Math.Abs(record.Product.RemainingWeight) < 0.0001m)
            {
                record.Product.RemainingWeight = 0;
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/washgrading/records/{id}
    [HttpDelete("records/{id}")]
    public async Task<IActionResult> DeleteRecord(int id)
    {
        var record = await _context.WashGradingRecords
            .Include(r => r.Product)
            .Include(r => r.WashGradingProcess)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null) return NotFound();

        // Block deletion if this washed record has already been used in Mess Labour processing
        bool usedInMessLabour = await _context.ProcessingRecords
            .AnyAsync(pr => pr.WashGradingRecordId == id && pr.DeleteFlg == 0);
        if (usedInMessLabour)
            return BadRequest(new { message = "This washed record has already been used in Mess Labour processing and cannot be deleted." });


        // Revert inventory reconciliation:
        if (record.Product != null)
        {
            if (record.WashGradingProcessId.HasValue && record.WashGradingProcess != null)
            {
                // Subtract the difference between process.Weight and completed weight from the product
                decimal consumed = record.Weight + record.LostWeight;
                decimal diff = record.WashGradingProcess.Weight - consumed;

                if (Math.Abs(diff) > 0.0001m)
                {
                    string productUnit = (record.Product.Unit ?? "").ToLower().Trim();
                    bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
                    decimal diffInProductUnit = isProductKg ? diff * 1.633m : diff;

                    record.Product.RemainingWeight -= diffInProductUnit;
                    if (Math.Abs(record.Product.RemainingWeight) < 0.0001m)
                    {
                        record.Product.RemainingWeight = 0;
                    }
                }
            }
            else if (!record.WashGradingProcessId.HasValue)
            {
                // Skipped record: return the entire weight back to the product remaining weight
                string productUnit = (record.Product.Unit ?? "").ToLower().Trim();
                bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
                decimal weightInProductUnit = isProductKg ? record.Weight * 1.633m : record.Weight;

                record.Product.RemainingWeight += weightInProductUnit;
                if (Math.Abs(record.Product.RemainingWeight) < 0.0001m)
                {
                    record.Product.RemainingWeight = 0;
                }
            }
        }

        _context.WashGradingRecords.Remove(record);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/washgrading/records
    [HttpPost("records")]
    public async Task<ActionResult<WashGradingRecordDto>> CreateRecord([FromBody] CreateWashGradingProcessDto dto)
    {
        var product = await _context.Products
            .Include(p => p.Warehouse)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId);

        if (product == null) return BadRequest(new { message = "Product not found" });

        // Convert viss to KG if product unit is KG
        string productUnit = (product.Unit ?? "").ToLower().Trim();
        bool isProductKg = productUnit.Contains("kg") || productUnit.Contains("kilogram");
        decimal weightInProductUnit = isProductKg ? dto.Weight * 1.633m : dto.Weight;

        if (weightInProductUnit > product.RemainingWeight)
            return BadRequest(new { message = $"လက်ကျန် မလုံလောက်ပါ (ကျန်: {product.RemainingWeight})" });

        product.RemainingWeight -= weightInProductUnit;
        if (Math.Abs(product.RemainingWeight) < 0.0001m)
        {
            product.RemainingWeight = 0;
        }

        var record = new WashGradingRecord
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProductId = dto.ProductId,
            Weight = dto.Weight,
            LostWeight = 0,
            RemainingWeight = dto.Weight,
            WashGradingWorkerId = null,
            WashGradingProcessId = null,
            WorkerFees = 0
        };

        _context.WashGradingRecords.Add(record);
        await _context.SaveChangesAsync();

        string warehouseName = product.Warehouse?.Name ?? "";

        return Ok(new WashGradingRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            ProductId = record.ProductId,
            ProductMarker = product.Marker,
            Weight = record.Weight,
            WarehouseName = warehouseName,
            WarehouseId = product.WarehouseId,
            WashGradingWorkerId = null,
            WashGradingWorkerName = "---",
            LostWeight = 0,
            WorkerFees = 0
        });
    }
}
