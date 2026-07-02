using AKZ.API.Models;
using Microsoft.EntityFrameworkCore;
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

        // Rename legacy Sales3 permissions if they exist
        var legacyPermissions = context.Permissions.Where(p => p.Name.StartsWith("Sales3.")).ToList();
        var existingPermissionNames = context.Permissions.Select(p => p.Name).ToList();
        
        if (legacyPermissions.Any())
        {
            foreach (var p in legacyPermissions)
            {
                var newName = p.Name.Replace("Sales3.", "Refinement.");
                if (existingPermissionNames.Contains(newName))
                {
                    // If target already exists, just remove the old one (or keep it if it has no role links, but safer to delete)
                    context.Permissions.Remove(p);
                }
                else
                {
                    p.Name = newName;
                }
            }
            context.SaveChanges();
        }

        // Rename legacy Sales1 permissions
        var legacyMessLabourPermissions = context.Permissions.Where(p => p.Name.StartsWith("Sales1.")).ToList();
        var existingPermNames2 = context.Permissions.Select(p => p.Name).ToList();

        if (legacyMessLabourPermissions.Any())
        {
            foreach (var p in legacyMessLabourPermissions)
            {
                var newName = p.Name.Replace("Sales1.", "MessLabour.");
                if (existingPermNames2.Contains(newName))
                {
                    context.Permissions.Remove(p);
                }
                else
                {
                    p.Name = newName;
                }
            }
            context.SaveChanges();
        }

        // Rename legacy Sales4 permissions
        var legacySales4Permissions = context.Permissions.Where(p => p.Name.StartsWith("Sales4.")).ToList();
        var existingPermNames4 = context.Permissions.Select(p => p.Name).ToList();

        if (legacySales4Permissions.Any())
        {
            foreach (var p in legacySales4Permissions)
            {
                var newName = p.Name.Replace("Sales4.", "SingleDoubleDrawn.");
                if (existingPermNames4.Contains(newName))
                {
                    context.Permissions.Remove(p);
                }
                else
                {
                    p.Name = newName;
                    if (p.Description != null)
                    {
                        p.Description = p.Description.Replace("Sales4", "Single & Double Drawn");
                    }
                }
            }
            context.SaveChanges();
        }

        // Update sales category from Sales4 to single-double-drawn
        var salesToUpdate = context.Sales.Where(s => s.Category == "Sales4").ToList();
        if (salesToUpdate.Any())
        {
            foreach (var sale in salesToUpdate)
            {
                sale.Category = "single-double-drawn";
            }
            context.SaveChanges();
        }

        // Rename legacy Sales5 permissions
        var legacySales5Permissions = context.Permissions.Where(p => p.Name.StartsWith("Sales5.")).ToList();
        var existingPermNames5 = context.Permissions.Select(p => p.Name).ToList();

        if (legacySales5Permissions.Any())
        {
            foreach (var p in legacySales5Permissions)
            {
                var newName = p.Name.Replace("Sales5.", "SemiExport.");
                if (existingPermNames5.Contains(newName))
                {
                    context.Permissions.Remove(p);
                }
                else
                {
                    p.Name = newName;
                    if (p.Description != null)
                    {
                        p.Description = p.Description.Replace("Sales5", "Semi Export");
                    }
                }
            }
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

            // Mess-Labour
            new Permission { Name = "MessLabour.View", Description = "View Mess-Labour records" },
            new Permission { Name = "MessLabour.Create", Description = "Create Mess-Labour records" },
            new Permission { Name = "MessLabour.Edit", Description = "Edit Mess-Labour records" },
            new Permission { Name = "MessLabour.Delete", Description = "Delete Mess-Labour records" },

            new Permission { Name = "Sales2.View", Description = "View Sales2 records" },
            new Permission { Name = "Sales2.Create", Description = "Create Sales2 records" },
            new Permission { Name = "Sales2.Edit", Description = "Edit Sales2 records" },
            new Permission { Name = "Sales2.Delete", Description = "Delete Sales2 records" },

            new Permission { Name = "Refinement.View", Description = "View Refinement records" },
            new Permission { Name = "Refinement.Create", Description = "Create Refinement records" },
            new Permission { Name = "Refinement.Edit", Description = "Edit Refinement records" },
            new Permission { Name = "Refinement.Delete", Description = "Delete Refinement records" },

            new Permission { Name = "WashGrading.View", Description = "View Wash/Grading records" },
            new Permission { Name = "WashGrading.Create", Description = "Create Wash/Grading records" },
            new Permission { Name = "WashGrading.Edit", Description = "Edit Wash/Grading records" },
            new Permission { Name = "WashGrading.Delete", Description = "Delete Wash/Grading records" },

            new Permission { Name = "SingleDoubleDrawn.View", Description = "View Single & Double Drawn records" },
            new Permission { Name = "SingleDoubleDrawn.Create", Description = "Create Single & Double Drawn records" },
            new Permission { Name = "SingleDoubleDrawn.Edit", Description = "Edit Single & Double Drawn records" },
            new Permission { Name = "SingleDoubleDrawn.Delete", Description = "Delete Single & Double Drawn records" },

            new Permission { Name = "SemiExport.View", Description = "View Semi Export records" },
            new Permission { Name = "SemiExport.Create", Description = "Create Semi Export records" },
            new Permission { Name = "SemiExport.Edit", Description = "Edit Semi Export records" },
            new Permission { Name = "SemiExport.Delete", Description = "Delete Semi Export records" },

            new Permission { Name = "Sales6.View", Description = "View Sales6 records" },
            new Permission { Name = "Sales6.Create", Description = "Create Sales6 records" },
            new Permission { Name = "Sales6.Edit", Description = "Edit Sales6 records" },
            new Permission { Name = "Sales6.Delete", Description = "Delete Sales6 records" },

            // Cash Flow
            new Permission { Name = "CashFlow.View", Description = "View Cash Flow records" },
            new Permission { Name = "CashFlow.Create", Description = "Create Cash Flow records" },
            new Permission { Name = "CashFlow.Edit", Description = "Edit Cash Flow records" },
            new Permission { Name = "CashFlow.Delete", Description = "Delete Cash Flow records" },

            // Workers
            new Permission { Name = "Workers.View", Description = "View Workers" },
            new Permission { Name = "Workers.Create", Description = "Create Workers" },
            new Permission { Name = "Workers.Edit", Description = "Edit Workers" },
            new Permission { Name = "Workers.Delete", Description = "Delete Workers" },

            // Semi Export Purchase
            new Permission { Name = "SemiExportPurchase.View", Description = "View Semi Export Purchase records" },
            new Permission { Name = "SemiExportPurchase.Create", Description = "Create Semi Export Purchase records" },
            new Permission { Name = "SemiExportPurchase.Edit", Description = "Edit Semi Export Purchase records" },
            new Permission { Name = "SemiExportPurchase.Delete", Description = "Delete Semi Export Purchase records" },
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
            string[] managerPerms = { "Dashboard.View", "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete", "Warehouse.View", "Sales.View", "MessLabour.View", "Sales2.View", "Refinement.View", "WashGrading.View", "SingleDoubleDrawn.View", "SemiExport.View", "Sales6.View", "Staff.View" };
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
            string[] sellerPerms = { "Dashboard.View", "Inventory.View", "Sales.View", "Sales.Create", "MessLabour.View", "MessLabour.Create", "Sales2.View", "Sales2.Create" };
            foreach (var pName in sellerPerms)
            {
                if (perms.TryGetValue(pName, out var p) && !existingRolePerms.Any(rp => rp.RoleId == sellerRole.Id && rp.PermissionId == p.Id))
                {
                    newRolePermissions.Add(new RolePermission { RoleId = sellerRole.Id, PermissionId = p.Id });
                }
            }
            // Explicitly remove unwanted permissions if they were previously assigned
            string[] permsToRemove = { "Refinement.View", "Refinement.Create", "SingleDoubleDrawn.View", "SingleDoubleDrawn.Create", "SemiExport.View", "SemiExport.Create", "Sales6.View", "Sales6.Create" };
            var unwantedRPs = context.RolePermissions
                .Include(rp => rp.Permission)
                .Where(rp => rp.RoleId == sellerRole.Id && permsToRemove.Contains(rp.Permission!.Name))
                .ToList();
            if (unwantedRPs.Any())
            {
                context.RolePermissions.RemoveRange(unwantedRPs);
                context.SaveChanges();
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
