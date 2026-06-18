namespace AKZ.API.DTOs;

public class SemiExportPurchaseRecordDto
{
    public int Id { get; set; }
    public int SemiExportPurchaseProcessingId { get; set; }
    public int SemiExportPurchaseId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public DateTime ReceiveDateTime { get; set; }
    public decimal AssignWeight { get; set; }
    public decimal LostWeight { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public decimal WorkerFees { get; set; }
    public int? ExchangeRateId { get; set; }
    public decimal ExchangeRateRate { get; set; }
    public List<SemiExportPurchaseRecordSizeDto> Sizes { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CreateSemiExportPurchaseRecordDto
{
    public int SemiExportPurchaseProcessingId { get; set; }
    public int? ExchangeRateId { get; set; }
    public decimal ExchangeRateRate { get; set; }
    public decimal WorkerFees { get; set; }
    public List<SemiExportPurchaseRecordSizeDto> Sizes { get; set; } = new();
}

public class SemiExportPurchaseRecordSizeDto
{
    public string Size { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
}
