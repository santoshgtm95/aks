namespace AKZ.API.DTOs;

public class ProcessingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
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

    // Remaining counts per category
    public int RemRedCount { get; set; }
    public int RemWhiteCount { get; set; }
    public int RemSpecialCount { get; set; }
    public int RemNaturalCount { get; set; }
    public int RemNaturalWhiteCount { get; set; }
    public int RemNaturalRedCount { get; set; }
    public int RemShortCutCount { get; set; }
    public int RemArtificialCount { get; set; }
    public int RemShortCount { get; set; }

    // Remaining weights per category
    public decimal RemRedWeight { get; set; }
    public decimal RemWhiteWeight { get; set; }
    public decimal RemSpecialWeight { get; set; }
    public decimal RemNaturalWeight { get; set; }
    public decimal RemNaturalWhiteWeight { get; set; }
    public decimal RemNaturalRedWeight { get; set; }
    public decimal RemShortCutWeight { get; set; }
    public decimal RemArtificialWeight { get; set; }
    public decimal RemShortWeight { get; set; }
    public bool IsLocked { get; set; }
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
