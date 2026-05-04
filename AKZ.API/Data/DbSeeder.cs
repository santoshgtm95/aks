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
            var initialRoles = new List<Role>
            {
                new Role { Name = "Owner", Description = "Full system access" },
                new Role { Name = "Manager", Description = "Manage operations and staff" },
                new Role { Name = "Seller", Description = "Handle sales transactions" },
                new Role { Name = "Warehouse Manager", Description = "Manage warehouse and inventory" }
            };
            context.Roles.AddRange(initialRoles);
            context.SaveChanges();
        }

        // Seed Permissions
        var allPermissions = new List<Permission>
        {
            // Dashboard
            new Permission { Name = "Dashboard.View", Description = "View dashboard reports" },
            
            // Inventory
            new Permission { Name = "Inventory.View", Description = "View inventory" },
            new Permission { Name = "Inventory.Create", Description = "Register new products" },
            new Permission { Name = "Inventory.Edit", Description = "Edit products" },
            new Permission { Name = "Inventory.Delete", Description = "Delete products" },

            // Warehouse Management
            new Permission { Name = "Warehouse.View", Description = "View warehouses" },
            new Permission { Name = "Warehouse.Create", Description = "Create warehouse" },
            new Permission { Name = "Warehouse.Edit", Description = "Edit warehouse" },
            new Permission { Name = "Warehouse.Delete", Description = "Delete warehouse" },

            // Staff
            new Permission { Name = "Staff.View", Description = "View staff list" },
            new Permission { Name = "Staff.Create", Description = "Create staff" },
            new Permission { Name = "Staff.Edit", Description = "Edit staff" },
            new Permission { Name = "Staff.Delete", Description = "Delete staff" },

            // Permissions
            new Permission { Name = "Permissions.Manage", Description = "Manage user permissions" },

            // Sales
            new Permission { Name = "Sales.View", Description = "View Sales records" },
            new Permission { Name = "Sales.Create", Description = "Create Sales records" },
            new Permission { Name = "Sales.Edit", Description = "Edit Sales records" },
            new Permission { Name = "Sales.Delete", Description = "Delete Sales records" },

            // Sales 1-6
            new Permission { Name = "Sales1.View", Description = "View Sales1 records" },
            new Permission { Name = "Sales1.Create", Description = "Create Sales1 records" },
            new Permission { Name = "Sales1.Edit", Description = "Edit Sales1 records" },
            new Permission { Name = "Sales1.Delete", Description = "Delete Sales1 records" },

            new Permission { Name = "Sales2.View", Description = "View Sales2 records" },
            new Permission { Name = "Sales2.Create", Description = "Create Sales2 records" },
            new Permission { Name = "Sales2.Edit", Description = "Edit Sales2 records" },
            new Permission { Name = "Sales2.Delete", Description = "Delete Sales2 records" },

            new Permission { Name = "Sales3.View", Description = "View Sales3 records" },
            new Permission { Name = "Sales3.Create", Description = "Create Sales3 records" },
            new Permission { Name = "Sales3.Edit", Description = "Edit Sales3 records" },
            new Permission { Name = "Sales3.Delete", Description = "Delete Sales3 records" },

            new Permission { Name = "Sales4.View", Description = "View Sales4 records" },
            new Permission { Name = "Sales4.Create", Description = "Create Sales4 records" },
            new Permission { Name = "Sales4.Edit", Description = "Edit Sales4 records" },
            new Permission { Name = "Sales4.Delete", Description = "Delete Sales4 records" },

            new Permission { Name = "Sales5.View", Description = "View Sales5 records" },
            new Permission { Name = "Sales5.Create", Description = "Create Sales5 records" },
            new Permission { Name = "Sales5.Edit", Description = "Edit Sales5 records" },
            new Permission { Name = "Sales5.Delete", Description = "Delete Sales5 records" },

            new Permission { Name = "Sales6.View", Description = "View Sales6 records" },
            new Permission { Name = "Sales6.Create", Description = "Create Sales6 records" },
            new Permission { Name = "Sales6.Edit", Description = "Edit Sales6 records" },
            new Permission { Name = "Sales6.Delete", Description = "Delete Sales6 records" },
        };

        var existingPerms = context.Permissions.Select(p => p.Name).ToList();
        var permsToAdd = allPermissions.Where(p => !existingPerms.Contains(p.Name)).ToList();
        
        if (permsToAdd.Any())
        {
            context.Permissions.AddRange(permsToAdd);
            context.SaveChanges();
        }

        // Seed Role Permissions
        var roles = context.Roles.ToDictionary(r => r.Name);
        var perms = context.Permissions.ToDictionary(p => p.Name);

        var existingRolePerms = context.RolePermissions.ToList();
        var newRolePermissions = new List<RolePermission>();

        // Owner - All permissions
        if (roles.TryGetValue("Owner", out var ownerRole))
        {
            foreach (var p in perms.Values)
            {
                if (!existingRolePerms.Any(rp => rp.RoleId == ownerRole.Id && rp.PermissionId == p.Id))
                {
                    newRolePermissions.Add(new RolePermission { RoleId = ownerRole.Id, PermissionId = p.Id });
                }
            }
        }

        // Manager (Base Seed)
        if (roles.TryGetValue("Manager", out var managerRole))
        {
            string[] managerPerms = { "Dashboard.View", "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete", "Warehouse.View", "Sales.View", "Sales1.View", "Sales2.View", "Sales3.View", "Sales4.View", "Sales5.View", "Sales6.View", "Staff.View" };
            foreach (var pName in managerPerms)
            {
                if (perms.TryGetValue(pName, out var p) && !existingRolePerms.Any(rp => rp.RoleId == managerRole.Id && rp.PermissionId == p.Id))
                {
                    newRolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = p.Id });
                }
            }
        }

        // Seller (Base Seed)
        if (roles.TryGetValue("Seller", out var sellerRole))
        {
            string[] sellerPerms = { "Dashboard.View", "Inventory.View", "Sales.View", "Sales.Create", "Sales1.View", "Sales1.Create", "Sales2.View", "Sales2.Create", "Sales3.View", "Sales3.Create", "Sales4.View", "Sales4.Create", "Sales5.View", "Sales5.Create", "Sales6.View", "Sales6.Create" };
            foreach (var pName in sellerPerms)
            {
                if (perms.TryGetValue(pName, out var p) && !existingRolePerms.Any(rp => rp.RoleId == sellerRole.Id && rp.PermissionId == p.Id))
                {
                    newRolePermissions.Add(new RolePermission { RoleId = sellerRole.Id, PermissionId = p.Id });
                }
            }
        }

        // Warehouse Manager (Base Seed)
        if (roles.TryGetValue("Warehouse Manager", out var whRole))
        {
            string[] whPerms = { "Dashboard.View", "Warehouse.View", "Warehouse.Create", "Warehouse.Edit", "Warehouse.Delete" };
            foreach (var pName in whPerms)
            {
                if (perms.TryGetValue(pName, out var p) && !existingRolePerms.Any(rp => rp.RoleId == whRole.Id && rp.PermissionId == p.Id))
                {
                    newRolePermissions.Add(new RolePermission { RoleId = whRole.Id, PermissionId = p.Id });
                }
            }
        }

        if (newRolePermissions.Any())
        {
            context.RolePermissions.AddRange(newRolePermissions);
            context.SaveChanges();
        }

        // Seed Default Owner User
        if (!context.Users.Any())
        {
            if (roles.TryGetValue("Owner", out var oRole))
            {
                var defaultUser = new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    FullName = "System Administrator",
                    Email = "admin@akz.com",
                    PhoneNumber = "09123456789",
                    RoleId = oRole.Id,
                    IsActive = true
                };
                context.Users.Add(defaultUser);
                context.SaveChanges();
            }
        }
    }
}
