using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

[Table("SemiExportPurchaseRecords")]
public class SemiExportPurchaseRecord : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SemiExportPurchaseProcessingId { get; set; }

    [ForeignKey("SemiExportPurchaseProcessingId")]
    public SemiExportPurchaseProcessing? SemiExportPurchaseProcessing { get; set; }

    [Required]
    public int SemiExportPurchaseId { get; set; }

    [ForeignKey("SemiExportPurchaseId")]
    public SemiExportPurchase? SemiExportPurchase { get; set; }

    [Required]
    [MaxLength(255)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Contact { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Color { get; set; } = string.Empty;

    [Required]
    public DateTime ReceiveDateTime { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal AssignWeight { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal LostWeight { get; set; }

    [Required]
    [MaxLength(255)]
    public string WorkerName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,4)")]
    public decimal WorkerFees { get; set; }

    public int? ExchangeRateId { get; set; }

    [ForeignKey("ExchangeRateId")]
    public ExchangeRate? ExchangeRate { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ExchangeRateRate { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Size6Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size6Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size7Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size7Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size8Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size8Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size9Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size9Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10BWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size10BPrice { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size12Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size12Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size14Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size14Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size16Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size16Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size18Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size18Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size20Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size20Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size22Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size22Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size24Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size24Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size26Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size26Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size28Weight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal Size28Price { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal SizeBarWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal SizeBarPrice { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal ReturnPrice { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilageWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal SpoilagePrice { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal LostSizeWeight { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal LostSizePrice { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
