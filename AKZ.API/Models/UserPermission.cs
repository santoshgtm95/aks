using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("UserPermissions")]
public class UserPermission : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    public int PermissionId { get; set; }

    [ForeignKey("PermissionId")]
    public Permission Permission { get; set; } = null!;

    public bool IsGranted { get; set; } = true;
}
