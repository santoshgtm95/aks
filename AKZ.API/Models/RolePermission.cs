using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("RolePermissions")]
public class RolePermission : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int RoleId { get; set; }

    [ForeignKey("RoleId")]
    public Role Role { get; set; } = null!;

    public int PermissionId { get; set; }

    [ForeignKey("PermissionId")]
    public Permission Permission { get; set; } = null!;
}
