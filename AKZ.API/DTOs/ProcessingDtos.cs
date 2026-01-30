namespace AKZ.API.DTOs;

public class ProcessingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WorkerNames { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public decimal WhiteWeight { get; set; }
    public decimal SpecialWeight { get; set; }
    public decimal NaturalWeight { get; set; }
    public decimal ShortWeight { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal Difference { get; set; }
}

public class CreateProcessingRecordDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string WorkerNames { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public decimal WhiteWeight { get; set; }
    public decimal SpecialWeight { get; set; }
    public decimal NaturalWeight { get; set; }
    public decimal ShortWeight { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal Difference { get; set; }
}
