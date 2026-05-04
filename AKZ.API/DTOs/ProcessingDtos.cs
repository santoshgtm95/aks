namespace AKZ.API.DTOs;

public class ProcessingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WorkerNames { get; set; } = string.Empty;
    public int Count { get; set; }
    public int RemainingCount { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public int RedCount { get; set; }
    public decimal WhiteWeight { get; set; }
    public int WhiteCount { get; set; }
    public decimal SpecialWeight { get; set; }
    public int SpecialCount { get; set; }
    public decimal NaturalWeight { get; set; }
    public int NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public int NaturalWhiteCount { get; set; }
    public decimal NaturalRedWeight { get; set; }
    public int NaturalRedCount { get; set; }
    public decimal ShortCutWeight { get; set; }
    public int ShortCutCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public int ArtificialCount { get; set; }
    public decimal ShortWeight { get; set; }
    public int ShortCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }
}

public class CreateProcessingRecordDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string WorkerNames { get; set; } = string.Empty;
    public int Count { get; set; }
    public int RemainingCount { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public int RedCount { get; set; }
    public decimal WhiteWeight { get; set; }
    public int WhiteCount { get; set; }
    public decimal SpecialWeight { get; set; }
    public int SpecialCount { get; set; }
    public decimal NaturalWeight { get; set; }
    public int NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public int NaturalWhiteCount { get; set; }
    public decimal NaturalRedWeight { get; set; }
    public int NaturalRedCount { get; set; }
    public decimal ShortCutWeight { get; set; }
    public int ShortCutCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public int ArtificialCount { get; set; }
    public decimal ShortWeight { get; set; }
    public int ShortCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }
}
