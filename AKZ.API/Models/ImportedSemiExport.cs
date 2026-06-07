using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("ImportedSemiExports")]
public class ImportedSemiExport : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string MarkerName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalSortedWeight { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public string DataJson { get; set; } = string.Empty;
}