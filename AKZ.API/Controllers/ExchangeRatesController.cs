using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExchangeRatesController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ExchangeRatesController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExchangeRateDto>>> GetExchangeRates()
    {
        var rates = await _context.ExchangeRates
            .OrderByDescending(r => r.Id)
            .Select(r => new ExchangeRateDto
            {
                Id = r.Id,
                FromCurrency = r.FromCurrency,
                ToCurrency = r.ToCurrency,
                Rate = r.Rate,
                ActiveStatus = r.ActiveStatus,
                CreateDate = r.CreateDate,
                CreateBy = r.CreateBy
            })
            .ToListAsync();

        return Ok(rates);
    }
    
    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<ExchangeRateDto>>> GetActiveExchangeRates()
    {
        var rates = await _context.ExchangeRates
            .Where(r => r.ActiveStatus)
            .OrderByDescending(r => r.Id)
            .Select(r => new ExchangeRateDto
            {
                Id = r.Id,
                FromCurrency = r.FromCurrency,
                ToCurrency = r.ToCurrency,
                Rate = r.Rate,
                ActiveStatus = r.ActiveStatus,
                CreateDate = r.CreateDate,
                CreateBy = r.CreateBy
            })
            .ToListAsync();

        return Ok(rates);
    }

    [HttpPost]
    public async Task<ActionResult<ExchangeRateDto>> CreateExchangeRate(CreateExchangeRateDto dto)
    {
        // For the new active rate, set existing ones of same pair to inactive
        if (dto.ActiveStatus)
        {
            var existingActive = await _context.ExchangeRates
                .Where(r => r.FromCurrency == dto.FromCurrency && r.ToCurrency == dto.ToCurrency && r.ActiveStatus)
                .ToListAsync();

            foreach (var existing in existingActive)
            {
                existing.ActiveStatus = false;
            }
        }

        var rate = new ExchangeRate
        {
            FromCurrency = dto.FromCurrency,
            ToCurrency = dto.ToCurrency,
            Rate = dto.Rate,
            ActiveStatus = dto.ActiveStatus
        };

        _context.ExchangeRates.Add(rate);
        await _context.SaveChangesAsync();

        var createdDto = new ExchangeRateDto
        {
            Id = rate.Id,
            FromCurrency = rate.FromCurrency,
            ToCurrency = rate.ToCurrency,
            Rate = rate.Rate,
            ActiveStatus = rate.ActiveStatus,
            CreateDate = rate.CreateDate,
            CreateBy = rate.CreateBy
        };

        return CreatedAtAction(nameof(GetExchangeRates), new { id = rate.Id }, createdDto);
    }
}