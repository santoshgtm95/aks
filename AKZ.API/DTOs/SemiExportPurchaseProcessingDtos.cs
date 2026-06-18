namespace AKZ.API.DTOs;

public class SemiExportPurchaseProcessingDto
{
    public int Id { get; set; }
    public int SemiExportPurchaseId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public DateTime ReceiveDateTime { get; set; }
    public string Color { get; set; } = string.Empty;
    public int WorkerId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public decimal AssignWeight { get; set; }
    public decimal LostWeight { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateSemiExportPurchaseProcessingDto
{
    public int SemiExportPurchaseId { get; set; }
    public int WorkerId { get; set; }
    public decimal AssignWeight { get; set; }
    public decimal LostWeight { get; set; }
}
