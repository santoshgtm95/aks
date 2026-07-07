namespace AKZ.API.DTOs;

public class ProcessingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public int? WashGradingRecordId { get; set; }
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
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }
    public decimal RegularWeight { get; set; }
    public double RegularCount { get; set; }
    public decimal BlackWeight { get; set; }
    public double BlackCount { get; set; }
    public decimal RegularExtraWeight { get; set; }
    public double RegularExtraCount { get; set; }
    public decimal BlackExtraWeight { get; set; }
    public double BlackExtraCount { get; set; }
    public decimal WhiteExtraWeight { get; set; }
    public double WhiteExtraCount { get; set; }
    public decimal NaturalWhiteExtraWeight { get; set; }
    public double NaturalWhiteExtraCount { get; set; }
    public decimal OffCutsWeight { get; set; }
    public double OffCutsCount { get; set; }
    public decimal ReclaimedWeight { get; set; }
    public double ReclaimedCount { get; set; }
    public decimal FluffWeight { get; set; }
    public double FluffCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }

    // Remaining counts per category
    public double RemRedCount { get; set; }
    public double RemWhiteCount { get; set; }
    public double RemNaturalCount { get; set; }
    public double RemNaturalWhiteCount { get; set; }
    public double RemArtificialCount { get; set; }
    public double RemRegularCount { get; set; }
    public double RemBlackCount { get; set; }
    public double RemRegularExtraCount { get; set; }
    public double RemBlackExtraCount { get; set; }
    public double RemWhiteExtraCount { get; set; }
    public double RemNaturalWhiteExtraCount { get; set; }
    public double RemOffCutsCount { get; set; }
    public double RemReclaimedCount { get; set; }
    public double RemFluffCount { get; set; }

    // Remaining weights per category
    public decimal RemRedWeight { get; set; }
    public decimal RemWhiteWeight { get; set; }
    public decimal RemNaturalWeight { get; set; }
    public decimal RemNaturalWhiteWeight { get; set; }
    public decimal RemArtificialWeight { get; set; }
    public decimal RemRegularWeight { get; set; }
    public decimal RemBlackWeight { get; set; }
    public decimal RemRegularExtraWeight { get; set; }
    public decimal RemBlackExtraWeight { get; set; }
    public decimal RemWhiteExtraWeight { get; set; }
    public decimal RemNaturalWhiteExtraWeight { get; set; }
    public decimal RemOffCutsWeight { get; set; }
    public decimal RemReclaimedWeight { get; set; }
    public decimal RemFluffWeight { get; set; }
    public bool IsLocked { get; set; }
    public decimal WorkerFees { get; set; }
    public List<ProcessingRecordWorkerDto> Workers { get; set; } = new();
}

public class ProcessingRecordWorkerDto
{
    public int MessLabourWorkerId { get; set; }
    public string? MessLabourWorkerName { get; set; }
    public decimal WorkerFee { get; set; }
}

public class CreateProcessingRecordDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public int? WashGradingRecordId { get; set; }
    public string WorkerNames { get; set; } = string.Empty;
    public List<ProcessingRecordWorkerDto> Workers { get; set; } = new();
    public double Count { get; set; }
    public double RemainingCount { get; set; }
    public decimal UnitWeight { get; set; }
    public decimal RedWeight { get; set; }
    public double RedCount { get; set; }
    public decimal WhiteWeight { get; set; }
    public double WhiteCount { get; set; }
    public decimal NaturalWeight { get; set; }
    public double NaturalCount { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public double NaturalWhiteCount { get; set; }
    public decimal ArtificialWeight { get; set; }
    public double ArtificialCount { get; set; }
    public decimal RegularWeight { get; set; }
    public double RegularCount { get; set; }
    public decimal BlackWeight { get; set; }
    public double BlackCount { get; set; }
    public decimal RegularExtraWeight { get; set; }
    public double RegularExtraCount { get; set; }
    public decimal BlackExtraWeight { get; set; }
    public double BlackExtraCount { get; set; }
    public decimal WhiteExtraWeight { get; set; }
    public double WhiteExtraCount { get; set; }
    public decimal NaturalWhiteExtraWeight { get; set; }
    public double NaturalWhiteExtraCount { get; set; }
    public decimal OffCutsWeight { get; set; }
    public double OffCutsCount { get; set; }
    public decimal ReclaimedWeight { get; set; }
    public double ReclaimedCount { get; set; }
    public decimal FluffWeight { get; set; }
    public double FluffCount { get; set; }
    public decimal LossWeight { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal? RemainingWeightKg { get; set; }
    public decimal Difference { get; set; }
    public decimal WorkerFees { get; set; }
}
