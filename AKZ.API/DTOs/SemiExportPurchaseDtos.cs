namespace AKZ.API.DTOs;

public class SemiExportPurchaseDto
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public decimal TotalReceiveWeight { get; set; }
    public DateTime ReceiveDateTime { get; set; }
    public string Color { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateSemiExportPurchaseDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public decimal TotalReceiveWeight { get; set; }
    public DateTime ReceiveDateTime { get; set; }
    public string Color { get; set; } = string.Empty;
}
