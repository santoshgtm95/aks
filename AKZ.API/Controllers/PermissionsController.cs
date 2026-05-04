using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.Models;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly AKZDbContext _context;

    public PermissionsController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Permission>>> GetAllPermissions()
    {
        var permissions = await _context.Permissions.OrderBy(p => p.Name).ToListAsync();
        return Ok(permissions);
    }
}
