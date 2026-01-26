using AKZ.API.Models;
using BCrypt.Net;

namespace AKZ.API.Data;

public static class DbSeeder
{
    public static void SeedData(AKZDbContext context)
    {
        // Seed Roles
        if (!context.Roles.Any())
        {
            var roles = new List<Role>
            {
                new Role { Name = "Owner", Description = "Full system access" },
                new Role { Name = "Manager", Description = "Manage operations and staff" },
                new Role { Name = "Seller", Description = "Handle sales transactions" },
                new Role { Name = "Warehouse Manager", Description = "Manage warehouse and inventory" }
            };
            context.Roles.AddRange(roles);
            context.SaveChanges();
        }

        // Seed Permissions
        if (!context.Permissions.Any())
        {
            var permissions = new List<Permission>
            {
                new Permission { Name = "ViewDashboard", Description = "View dashboard reports" },
                new Permission { Name = "ManageWarehouse", Description = "Add, edit, delete products" },
                new Permission { Name = "ViewWarehouse", Description = "View warehouse inventory" },
                new Permission { Name = "ManageSales", Description = "Create and manage sales" },
                new Permission { Name = "ViewSales", Description = "View sales records" },
                new Permission { Name = "ManageStaff", Description = "Create, edit, delete staff" },
                new Permission { Name = "ViewStaff", Description = "View staff list" },
                new Permission { Name = "ManageRoles", Description = "Manage roles and permissions" }
            };
            context.Permissions.AddRange(permissions);
            context.SaveChanges();
        }

        // Seed Role Permissions
        if (!context.RolePermissions.Any())
        {
            var roles = context.Roles.ToDictionary(r => r.Name);
            var perms = context.Permissions.ToDictionary(p => p.Name);

            var rolePermissions = new List<RolePermission>();

            // Owner - All permissions
            if (roles.TryGetValue("Owner", out var ownerRole))
            {
                foreach (var p in perms.Values)
                {
                    rolePermissions.Add(new RolePermission { RoleId = ownerRole.Id, PermissionId = p.Id });
                }
            }

            // Manager
            if (roles.TryGetValue("Manager", out var managerRole))
            {
                string[] managerPerms = { "ViewDashboard", "ManageWarehouse", "ViewWarehouse", "ManageSales", "ViewSales", "ViewStaff" };
                foreach (var pName in managerPerms)
                {
                    if (perms.TryGetValue(pName, out var p))
                        rolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = p.Id });
                }
            }

            // Seller
            if (roles.TryGetValue("Seller", out var sellerRole))
            {
                string[] sellerPerms = { "ViewDashboard", "ViewWarehouse", "ManageSales", "ViewSales" };
                foreach (var pName in sellerPerms)
                {
                    if (perms.TryGetValue(pName, out var p))
                        rolePermissions.Add(new RolePermission { RoleId = sellerRole.Id, PermissionId = p.Id });
                }
            }

            // Warehouse Manager
            if (roles.TryGetValue("Warehouse Manager", out var whRole))
            {
                string[] whPerms = { "ViewDashboard", "ManageWarehouse", "ViewWarehouse", "ViewSales" };
                foreach (var pName in whPerms)
                {
                    if (perms.TryGetValue(pName, out var p))
                        rolePermissions.Add(new RolePermission { RoleId = whRole.Id, PermissionId = p.Id });
                }
            }

            context.RolePermissions.AddRange(rolePermissions);
            context.SaveChanges();
        }

        // Seed Default Owner User
        if (!context.Users.Any())
        {
            var ownerRole = context.Roles.FirstOrDefault(r => r.Name == "Owner");
            if (ownerRole != null)
            {
                var defaultUser = new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    FullName = "System Administrator",
                    Email = "admin@akz.com",
                    PhoneNumber = "09123456789",
                    RoleId = ownerRole.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(defaultUser);
                context.SaveChanges();
            }
        }
    }
}
