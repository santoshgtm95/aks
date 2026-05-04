using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.Models;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public WorkersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Worker>>> GetWorkers()
    {
        return await _context.Workers
            .Where(w => w.IsActive)
            .OrderBy(w => w.Name)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Worker>> CreateWorker([FromBody] Worker worker)
    {
        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();
        return Ok(worker);
    }
}
