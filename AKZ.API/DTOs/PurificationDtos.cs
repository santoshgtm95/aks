namespace AKZ.API.DTOs;

public class PurificationProcessDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProcessingRecordId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double PurifyCount { get; set; }
    public decimal PurifyWeight { get; set; }
    public double RemainingCountAfter { get; set; }
    public decimal RemainingWeightAfter { get; set; }
    public int? PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public bool IsWeightFull { get; set; }
    public decimal WorkerFees { get; set; }
    public List<PurificationWorkerDto> Workers { get; set; } = new();
}

public class PurifiedRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProcessingRecordId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Count { get; set; }
    public decimal Weight { get; set; }
    public int? PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public bool IsWeightFull { get; set; }
    public decimal WorkerFees { get; set; }
    public List<PurificationWorkerDto> Workers { get; set; } = new();
}

public class PurificationWorkerDto
{
    public int Id { get; set; }
    public int PurifierId { get; set; }
    public string PurifierName { get; set; } = string.Empty;
    public double Count { get; set; }
    public decimal WorkerFees { get; set; }
}

public class CreatePurificationProcessDto
{
    public DateTime Date { get; set; }
    public int ProcessingRecordId { get; set; }
    public string Category { get; set; } = string.Empty;
    public double PurifyCount { get; set; }
    public int? PlaceId { get; set; }
    public bool IsWeightFull { get; set; }
    public decimal WorkerFees { get; set; }
    public List<CreatePurificationWorkerDto> Workers { get; set; } = new();
}

public class CreatePurificationWorkerDto
{
    public int PurifierId { get; set; }
    public double Count { get; set; }
    public decimal WorkerFees { get; set; }
}

public class AvailableCategoryDto
{
    public int ProcessingRecordId { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double RemainingCount { get; set; }
    public decimal RemainingWeight { get; set; }
    public decimal UnitWeight { get; set; }
    public int? WarehouseId { get; set; }
}
