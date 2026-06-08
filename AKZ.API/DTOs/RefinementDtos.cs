namespace AKZ.API.DTOs;

public class RefinementProcessDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int PurifiedRecordId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Count { get; set; }
    public decimal Weight { get; set; }
    public double RemainingCountAfter { get; set; }
    public decimal RemainingWeightAfter { get; set; }
    public int? RefinementWorkerId { get; set; }
    public string RefinementWorkerName { get; set; } = string.Empty;
    public decimal WorkerFees { get; set; }
}

public class RefinementRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int PurifiedRecordId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Count { get; set; }
    public decimal Weight { get; set; }
    public int? RefinementWorkerId { get; set; }
    public string RefinementWorkerName { get; set; } = string.Empty;
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }
    public decimal WorkerFees { get; set; }
}

public class CreateRefinementProcessDto
{
    public DateTime Date { get; set; }
    public int PurifiedRecordId { get; set; }
    public string Category { get; set; } = string.Empty;
    public double Count { get; set; }
    public int? RefinementWorkerId { get; set; }
    public decimal Weight { get; set; }
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }
    public decimal WorkerFees { get; set; }
}

public class AvailablePurifiedCategoryDto
{
    public int PurifiedRecordId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int? WarehouseId { get; set; }
    public string Category { get; set; } = string.Empty;
    public double RemainingCount { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal UnitWeight { get; set; }
}
