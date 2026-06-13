using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.Models;

namespace AKZ.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Owner")]
public class AuditLogsController : ControllerBase
{
    private readonly AKZDbContext _context;

    public AuditLogsController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAuditLogs()
    {
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.CreateDate)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.EntityName,
                a.EntityId,
                a.Details,
                a.Amount,
                a.CreateDate,
                Username = a.User != null ? a.User.Username : a.CreateBy
            })
            .Take(1000)
            .ToListAsync();

        return Ok(logs);
    }
}
