using System;

namespace AKZ.API.DTOs;

public class WashGradingProcessDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int? WarehouseId { get; set; }
    public decimal Weight { get; set; }
    public decimal RemainingWeightAfter { get; set; }
    public int? WashGradingWorkerId { get; set; }
    public string WashGradingWorkerName { get; set; } = string.Empty;
    public decimal WorkerFees { get; set; }
}

public class WashGradingRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int? WarehouseId { get; set; }
    public decimal Weight { get; set; }
    public int? WashGradingWorkerId { get; set; }
    public string WashGradingWorkerName { get; set; } = string.Empty;
    public decimal LostWeight { get; set; }
    public decimal WorkerFees { get; set; }
}

public class CreateWashGradingProcessDto
{
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public int? WashGradingWorkerId { get; set; }
    public decimal Weight { get; set; }
    public decimal LostWeight { get; set; }
    public decimal WorkerFees { get; set; }
}

public class AvailableProductDto
{
    public int ProductId { get; set; }
    public string ProductMarker { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int? WarehouseId { get; set; }
    public decimal RemainingWeight { get; set; }
    public string Unit { get; set; } = string.Empty;
}
