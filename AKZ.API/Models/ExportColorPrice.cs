using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("ExportColorPrices")]
public class ExportColorPrice
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ExportId { get; set; }

    [ForeignKey("ExportId")]
    public Export Export { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string ColorName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")] public decimal Price6 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price7 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price8 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price9 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price10 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price10B { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price12 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price14 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price16 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price18 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price20 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price22 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price24 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price26 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price28 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal PriceBar { get; set; }
}