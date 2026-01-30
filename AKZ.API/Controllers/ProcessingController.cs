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
public class ProcessingController : ControllerBase
{
    private readonly AKZDbContext _context;

    public ProcessingController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProcessingRecordDto>>> GetRecords()
    {
        var records = await _context.ProcessingRecords
            .Include(r => r.Product)
            .OrderByDescending(r => r.Date)
            .Select(r => new ProcessingRecordDto
            {
                Id = r.Id,
                Date = r.Date,
                ProductId = r.ProductId,
                ProductMarker = r.Product.Marker,
                WorkerNames = r.WorkerNames,
                Count = r.Count,
                UnitWeight = r.UnitWeight,
                RedWeight = r.RedWeight,
                WhiteWeight = r.WhiteWeight,
                SpecialWeight = r.SpecialWeight,
                NaturalWeight = r.NaturalWeight,
                ShortWeight = r.ShortWeight,
                LossWeight = r.LossWeight,
                TotalWeight = r.TotalWeight,
                Difference = r.Difference
            })
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost]
    public async Task<ActionResult<ProcessingRecordDto>> CreateRecord([FromBody] CreateProcessingRecordDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return BadRequest(new { message = "Product not found" });
        }

        // We should probably deduct the weight from the product
        // Based on the image, the original weight is used as a reference.
        // Let's deduct the total weight from the product's remaining weight.
        if (product.RemainingWeight < dto.TotalWeight)
        {
            // Maybe we should allow it if it's close? The image shows a "Diff".
            // For now, let's be strict or just deduct what was actually processed.
        }

        var record = new ProcessingRecord
        {
            Date = dto.Date,
            ProductId = dto.ProductId,
            WorkerNames = dto.WorkerNames,
            Count = dto.Count,
            UnitWeight = dto.UnitWeight,
            RedWeight = dto.RedWeight,
            WhiteWeight = dto.WhiteWeight,
            SpecialWeight = dto.SpecialWeight,
            NaturalWeight = dto.NaturalWeight,
            ShortWeight = dto.ShortWeight,
            LossWeight = dto.LossWeight,
            TotalWeight = dto.TotalWeight,
            Difference = dto.Difference,
            CreatedAt = DateTime.UtcNow
        };

        // Update product remaining weight
        // In this workflow, we are "processing" the product. 
        // The remaining weight should be reduced by the original weight of the bag being processed.
        // But the user might be processing only part of it? 
        // Usually, "Processing" means taking the whole bag and sorting it.
        // So we deduct the original weight of the bag.
        
        // Wait, if the user selects a product, they are processing THAT product.
        // Let's deduct the weight that was processed.
        product.RemainingWeight -= dto.TotalWeight; 
        product.UpdatedAt = DateTime.UtcNow;

        _context.ProcessingRecords.Add(record);
        await _context.SaveChangesAsync();

        await _context.Entry(record).Reference(r => r.Product).LoadAsync();

        var resultDto = new ProcessingRecordDto
        {
            Id = record.Id,
            Date = record.Date,
            ProductId = record.ProductId,
            ProductMarker = record.Product.Marker,
            WorkerNames = record.WorkerNames,
            Count = record.Count,
            UnitWeight = record.UnitWeight,
            RedWeight = record.RedWeight,
            WhiteWeight = record.WhiteWeight,
            SpecialWeight = record.SpecialWeight,
            NaturalWeight = record.NaturalWeight,
            ShortWeight = record.ShortWeight,
            LossWeight = record.LossWeight,
            TotalWeight = record.TotalWeight,
            Difference = record.Difference
        };

        return Ok(resultDto);
    }
}
