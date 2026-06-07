using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("Exports")]
public class Export : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int LedgerId { get; set; }

    [ForeignKey("LedgerId")]
    public Ledger Ledger { get; set; } = null!;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public string SelectedColors { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal SelectedWeight { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalExportWeightViss { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalExportWeightKg { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProductAmountMMK { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProductAmountCNY { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal WorkerFees { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal GrandTotalMMK { get; set; }

    public int? ExchangeRateId { get; set; }

    [ForeignKey("ExchangeRateId")]
    public ExchangeRate? ExchangeRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SellingPrice { get; set; }

    public string SizeSellingPrices { get; set; } = string.Empty;

    public ICollection<ExportColorPrice> ColorPrices { get; set; } = new List<ExportColorPrice>();
}
