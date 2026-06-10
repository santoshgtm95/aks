namespace AKZ.API.DTOs;

public class ProcessingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string WorkerNames { get; set; } = string.Empty;
    public double Count { get; set; }
    public double RemainingCount { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public double RedCount { get; set; }
    public decimal WhiteWeight { get; set; }
    public double WhiteCount { get; set; }
    public decimal SpecialWeight { get; set; }
    public double SpecialCount { get; set; }
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }
    public decimal NaturalRedWeight { get; set; }
    public double NaturalRedCount { get; set; }
    public decimal ShortCutWeight { get; set; }
    public double ShortCutCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }
    public decimal ShortWeight { get; set; }
    public double ShortCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }

    // Remaining counts per category
    public double RemRedCount { get; set; }
    public double RemWhiteCount { get; set; }
    public double RemSpecialCount { get; set; }
    public double RemNaturalCount { get; set; }
    public double RemNaturalWhiteCount { get; set; }
    public double RemNaturalRedCount { get; set; }
    public double RemShortCutCount { get; set; }
    public double RemArtificialCount { get; set; }
    public double RemShortCount { get; set; }

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
    public decimal WorkerFees { get; set; }
    public int? MessLabourWorkerId { get; set; }
    public string? MessLabourWorkerName { get; set; }
}

public class CreateProcessingRecordDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string WorkerNames { get; set; } = string.Empty;
    public int? MessLabourWorkerId { get; set; }
    public double Count { get; set; }
    public double RemainingCount { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public double RedCount { get; set; }
    public decimal WhiteWeight { get; set; }
    public double WhiteCount { get; set; }
    public decimal SpecialWeight { get; set; }
    public double SpecialCount { get; set; }
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }
    public decimal NaturalRedWeight { get; set; }
    public double NaturalRedCount { get; set; }
    public decimal ShortCutWeight { get; set; }
    public double ShortCutCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }
    public decimal ShortWeight { get; set; }
    public double ShortCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }
    public decimal WorkerFees { get; set; }
}
