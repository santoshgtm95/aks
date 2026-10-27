using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using AKZ.API.Services;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly AKZDbContext _context;
    private readonly ChangeNotifierService _notifier;

    public SalesController(AKZDbContext context, ChangeNotifierService notifier)
    {
        _context = context;
        _notifier = notifier;
    }

    private int? GetCurrentUserWarehouseId()
    {
        var claim = User.FindFirst("warehouseId")?.Value;
        if (string.IsNullOrEmpty(claim)) return null;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<List<SaleDto>>> GetSales([FromQuery] string? category = null)
    {
        var warehouseId = GetCurrentUserWarehouseId();
        var query = _context.Sales.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(s => s.Category == category);
        }

        if (warehouseId.HasValue)
        {
            query = query.Where(s => s.Product.WarehouseId == warehouseId);
        }

        var sales = await query
            .Include(s => s.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(s => s.Seller)
            .OrderByDescending(s => s.Date)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                Date = s.Date,
                ProductId = s.ProductId,
                ProductMarker = s.Product.Marker,
                Marker = s.Marker,
                Unit = s.Unit,
                Weight = s.Weight,
                PlusMinusWeight = s.PlusMinusWeight,
                Price = s.Price,
                Currency = s.Currency,
                ExchangeRateId = s.ExchangeRateId,
                ExchangeRateRate = s.ExchangeRateRate,
                SellerId = s.SellerId,
                SellerName = s.Seller.FullName,
                TotalRemaining = s.TotalRemaining,
                Category = s.Category,
                CustomerName = s.CustomerName,
                CustomerContact = s.CustomerContact,
                Remark = s.Remark,
                WarehouseName = s.Product.Warehouse != null ? s.Product.Warehouse.Name : ""
            })
            .ToListAsync();

        return Ok(sales);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SaleDto>> GetSale(int id)
    {
        var sale = await _context.Sales
            .Include(s => s.Product)
                .ThenInclude(p => p.Warehouse)
            .Include(s => s.Seller)
            .Where(s => s.Id == id)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                Date = s.Date,
                ProductId = s.ProductId,
                ProductMarker = s.Product.Marker,
                Marker = s.Marker,
                Unit = s.Unit,
                Weight = s.Weight,
                PlusMinusWeight = s.PlusMinusWeight,
                Price = s.Price,
                Currency = s.Currency,
                ExchangeRateId = s.ExchangeRateId,
                ExchangeRateRate = s.ExchangeRateRate,
                SellerId = s.SellerId,
                SellerName = s.Seller.FullName,
                TotalRemaining = s.TotalRemaining,
                Category = s.Category,
                CustomerName = s.CustomerName,
                CustomerContact = s.CustomerContact,
                Remark = s.Remark,
                WarehouseName = s.Product.Warehouse != null ? s.Product.Warehouse.Name : ""
            })
            .FirstOrDefaultAsync();

        if (sale == null)
        {
            return NotFound();
        }

        return Ok(sale);
    }

    [HttpPost]
    public async Task<ActionResult<SaleDto>> CreateSale([FromBody] CreateSaleDto dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

        // Check if product exists and has enough stock
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return BadRequest(new { message = "Product not found" });
        }

        const decimal VISS_TO_KG = 1.633m;
        string productUnit = (product.Unit ?? "").Trim().ToLower();
        string saleUnit = (dto.Unit ?? "").Trim().ToLower();

        bool isProductKg = productUnit == "kg" || productUnit == "kilogram";
        bool isSaleKg = saleUnit == "kg" || saleUnit == "kilogram";

        decimal soldInProductUnit = dto.Weight;
        decimal adjInProductUnit = dto.PlusMinusWeight;

        if (isProductKg && !isSaleKg)
        {
            // Product registered in KG, selling in Viss -> 1 viss = 1.633 kg
            soldInProductUnit = dto.Weight * VISS_TO_KG;
            adjInProductUnit = dto.PlusMinusWeight * VISS_TO_KG;
        }
        else if (!isProductKg && isSaleKg)
        {
            // Product registered in Viss, selling in KG -> 1 kg = 1 / 1.633 viss
            soldInProductUnit = dto.Weight / VISS_TO_KG;
            adjInProductUnit = dto.PlusMinusWeight / VISS_TO_KG;
        }

        decimal newRemaining = (product.RemainingWeight + adjInProductUnit) - soldInProductUnit;
        if (newRemaining < -0.0001m)
        {
            return BadRequest(new { message = "Insufficient stock" });
        }

        if (Math.Abs(newRemaining) < 0.0001m)
        {
            newRemaining = 0;
        }

        decimal roundedRemaining = Math.Round(newRemaining, 2);

        var sale = new Sale
        {
            Date = dto.Date.Date.Add(DateTime.UtcNow.AddHours(6.5).TimeOfDay),
            ProductId = dto.ProductId,
            Marker = dto.Marker,
            Unit = dto.Unit,
            Weight = dto.Weight,
            PlusMinusWeight = dto.PlusMinusWeight,
            Price = dto.Price,
            Currency = dto.Currency,
            ExchangeRateId = dto.ExchangeRateId,
            ExchangeRateRate = dto.ExchangeRateRate,
            SellerId = userId,
            TotalRemaining = roundedRemaining,
            Category = dto.Category,
            CustomerName = dto.CustomerName,
            CustomerContact = dto.CustomerContact,
            Remark = dto.Remark
        };

        // Update product remaining weight
        product.RemainingWeight = roundedRemaining;

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();
        _notifier.NotifyChange();

        // Reload to get navigation properties
        await _context.Entry(sale).Reference(s => s.Product).LoadAsync();
        await _context.Entry(sale.Product).Reference(p => p.Warehouse).LoadAsync();
        await _context.Entry(sale).Reference(s => s.Seller).LoadAsync();

        var saleDto = new SaleDto
        {
            Id = sale.Id,
            Date = sale.Date,
            ProductId = sale.ProductId,
            ProductMarker = sale.Product.Marker,
            Marker = sale.Marker,
            Unit = sale.Unit,
            Weight = sale.Weight,
            PlusMinusWeight = sale.PlusMinusWeight,
            Price = sale.Price,
            Currency = sale.Currency,
            ExchangeRateId = sale.ExchangeRateId,
            ExchangeRateRate = sale.ExchangeRateRate,
            SellerId = sale.SellerId,
            SellerName = sale.Seller.FullName,
            TotalRemaining = sale.TotalRemaining,
            Category = sale.Category,
            CustomerName = sale.CustomerName,
            CustomerContact = sale.CustomerContact,
            Remark = sale.Remark,
            WarehouseName = sale.Product.Warehouse != null ? sale.Product.Warehouse.Name : ""
        };

        return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, saleDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSale(int id)
    {
        try
        {
            var sale = await _context.Sales
                .Include(s => s.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null)
            {
                return NotFound(new { message = "Sale record not found" });
            }

            if (sale.Product != null)
            {
                const decimal VISS_TO_KG = 1.633m;
                string productUnit = (sale.Product.Unit ?? "").Trim().ToLower();
                string saleUnit = (sale.Unit ?? "").Trim().ToLower();

                bool isProductKg = productUnit == "kg" || productUnit == "kilogram";
                bool isSaleKg = saleUnit == "kg" || saleUnit == "kilogram";

                decimal netSold = sale.Weight - sale.PlusMinusWeight;
                decimal restoreWeight = netSold;

                if (isProductKg && !isSaleKg)
                {
                    restoreWeight = netSold * VISS_TO_KG;
                }
                else if (!isProductKg && isSaleKg)
                {
                    restoreWeight = netSold / VISS_TO_KG;
                }

                sale.Product.RemainingWeight = Math.Round(sale.Product.RemainingWeight + restoreWeight, 2);
                sale.Product.UpdateDate = DateTime.Now;
            }

            // AKZDbContext handles soft delete in SaveChangesAsync when state is Deleted
            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();
            _notifier.NotifyChange();

            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Failed to delete sale: " + ex.Message });
        }
    }
}
