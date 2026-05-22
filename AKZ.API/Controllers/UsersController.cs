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
public class UsersController : ControllerBase
{
    private readonly AKZDbContext _context;

    public UsersController(AKZDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Include(u => u.Warehouse)
            .Where(u => u.IsActive)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                RoleName = u.Role.Name,
                WarehouseId = u.WarehouseId,
                WarehouseName = u.Warehouse != null ? u.Warehouse.Name : null,
                Permissions = _context.UserPermissions.Any(up => up.UserId == u.Id)
                    ? _context.UserPermissions
                        .Where(up => up.UserId == u.Id && up.IsGranted)
                        .Select(up => up.Permission.Name)
                        .ToList()
                    : u.Role.RolePermissions.Select(rp => rp.Permission.Name).ToList()
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Include(u => u.Warehouse)
            .Where(u => u.Id == id)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                RoleName = u.Role.Name,
                WarehouseId = u.WarehouseId,
                WarehouseName = u.Warehouse != null ? u.Warehouse.Name : null,
                Permissions = _context.UserPermissions.Any(up => up.UserId == u.Id)
                    ? _context.UserPermissions
                        .Where(up => up.UserId == u.Id && up.IsGranted)
                        .Select(up => up.Permission.Name)
                        .ToList()
                    : u.Role.RolePermissions.Select(rp => rp.Permission.Name).ToList()

            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        // Check if username already exists
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == dto.Username && u.DeleteFlg == 0))
        {
            return BadRequest(new { message = "Username already exists" });
        }

        // Check if email already exists
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == dto.Email && u.DeleteFlg == 0))
        {
            return BadRequest(new { message = "Email already exists" });
        }

        // Validate RoleId
        if (dto.RoleId <= 0 || !await _context.Roles.AnyAsync(r => r.Id == dto.RoleId))
        {
            return BadRequest(new { message = "Please select a valid role" });
        }

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            RoleId = dto.RoleId,
            WarehouseId = dto.WarehouseId,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Fetch combined permissions (Role + User Overrides)
        var userPermissions = await _context.UserPermissions
            .Where(up => up.UserId == user.Id)
            .Select(up => up.Permission.Name)
            .ToListAsync();

        var rolePermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == user.RoleId)
            .Select(rp => rp.Permission.Name)
            .ToListAsync();

        var effectivePermissions = userPermissions.Any() ? userPermissions : rolePermissions;

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            RoleName = (await _context.Roles.FindAsync(user.RoleId))?.Name ?? "",
            Permissions = effectivePermissions
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.PhoneNumber = dto.PhoneNumber;
        user.RoleId = dto.RoleId;
        user.IsActive = dto.IsActive;
        user.WarehouseId = dto.WarehouseId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/permissions")]
    public async Task<ActionResult<List<int>>> GetUserPermissionIds(int id)
    {
        var permissionIds = await _context.UserPermissions
            .Where(up => up.UserId == id)
            .Select(up => up.PermissionId)
            .ToListAsync();

        // If no user-specific permissions, return role permissions as default
        if (!permissionIds.Any())
        {
            var user = await _context.Users
                .Include(u => u.Role)
                    .ThenInclude(r => r.RolePermissions)
                .FirstOrDefaultAsync(u => u.Id == id);
            
            if (user != null)
            {
                permissionIds = user.Role.RolePermissions.Select(rp => rp.PermissionId).ToList();
            }
        }

        return Ok(permissionIds);
    }

    [HttpPost("{id}/permissions")]
    public async Task<IActionResult> UpdateUserPermissions(int id, [FromBody] UpdateUserPermissionsDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Remove existing user-specific permissions
        var existingPermissions = await _context.UserPermissions
            .Where(up => up.UserId == id)
            .ToListAsync();
        
        _context.UserPermissions.RemoveRange(existingPermissions);

        // Add new permissions
        foreach (var permId in dto.PermissionIds)
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = id,
                PermissionId = permId,
                IsGranted = true
            });
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("roles")]
    public async Task<ActionResult<List<Role>>> GetRoles()
    {
        var roles = await _context.Roles.ToListAsync();
        return Ok(roles);
    }
}
