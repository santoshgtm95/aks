using System;
using System.Collections.Generic;

namespace AKZ.API.DTOs;

/// <summary>
/// Exported marker for report listing
/// </summary>
public class ExportedMarkerDto
{
    public int MarkerId { get; set; }
    public string MarkerName { get; set; } = string.Empty;
    public DateTime ExportDate { get; set; }
    public decimal TotalWeightExported { get; set; }
    public int LedgerId { get; set; }
    public string LedgerName { get; set; } = string.Empty;
    public string ExportStatus { get; set; } = "Exported";
}

/// <summary>
/// Request for generating report data
/// </summary>
public class ReportDataRequestDto
{
    public List<int> MarkerIds { get; set; } = new();
    public List<string> ReportTypes { get; set; } = new();
}

/// <summary>
/// Individual worker fee detail
/// </summary>
public class WorkerFeeDetailDto
{
    public int WorkerId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public decimal FeeAmount { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// Stage detail with weight and worker information
/// </summary>
public class StageDetailDto
{
    public string StageName { get; set; } = string.Empty;
    public DateTime StageDate { get; set; }
    public decimal InputWeight { get; set; }
    public decimal OutputWeight { get; set; }
    public decimal WeightLossKg { get; set; }
    public decimal WeightLossPercent { get; set; }
    public List<WorkerFeeDetailDto> Workers { get; set; } = new();
    public decimal TotalWorkerFees { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public decimal SupervisorFees { get; set; }
    public string Status { get; set; } = "Completed";
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Inventory Report: All data from raw material to export with stage-by-stage breakdown
/// </summary>
public class InventoryReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string SourceWarehouse { get; set; } = string.Empty;
    public decimal InitialRawMaterialWeight { get; set; }
    public string RawMaterialUnit { get; set; } = "kg";
    public string RawMaterialCategory { get; set; } = string.Empty;

    // Stage-by-stage breakdown
    public List<StageDetailDto> Stages { get; set; } = new();

    // Final summary
    public decimal FinalExportedWeight { get; set; }
    public decimal TotalWeightLossKg { get; set; }
    public decimal TotalWeightLossPercent { get; set; }
    public decimal TotalWorkerFeesAllStages { get; set; }
    public decimal TotalSupervisorFeesAllStages { get; set; }
    public decimal GrandTotalCostAllStages { get; set; }
    public string CompletionStatus { get; set; } = "Completed";
}

/// <summary>
/// Sales history detail for raw material report
/// </summary>
public class SalesHistoryDto
{
    public DateTime Date { get; set; }
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerContact { get; set; }
    public string? Remark { get; set; }
}

/// <summary>
/// Raw Material Report: Input sourcing and initial data
/// </summary>
public class RawMaterialReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public DateTime InputDate { get; set; }
    public decimal RawMaterialQuantity { get; set; }
    public string Unit { get; set; } = "kg";
    public string Category { get; set; } = string.Empty;
    public string SourceWarehouse { get; set; } = string.Empty;
    public decimal? RawMaterialCostPerUnit { get; set; }
    public decimal? TotalRawMaterialCost { get; set; }
    public string QualityGrade { get; set; } = string.Empty;
    public DateTime ProcessingStartDate { get; set; }
    public string Status { get; set; } = "In Progress";
    public string? Notes { get; set; }
    public string? MissingDataWarning { get; set; }
    public List<SalesHistoryDto> SalesHistory { get; set; } = new();
}

/// <summary>
/// Mess Labour Report: Processing stage worker details
/// </summary>
public class MessLabourReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public DateTime ProcessingDate { get; set; }
    public decimal QuantityProcessed { get; set; }
    public string Unit { get; set; } = "kg";

    // Per-worker details
    public List<WorkerFeeDetailDto> Workers { get; set; } = new();

    // Summary
    public decimal TotalWorkerFees { get; set; }
    public decimal FeePerUnitKg { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
    public string? MissingDataWarning { get; set; }

    // Categorized Distribution
    public decimal RedWeight { get; set; }
    public decimal WhiteWeight { get; set; }
    public decimal SpecialWeight { get; set; }
    public decimal NaturalWeight { get; set; }
    public decimal NaturalWhiteWeight { get; set; }
    public decimal NaturalRedWeight { get; set; }
    public decimal ShortCutWeight { get; set; }
    public decimal ArtificialWeight { get; set; }
    public decimal ShortWeight { get; set; }
    public decimal LossWeight { get; set; }
}

/// <summary>
/// Individual Purified Record Entry: Single purification batch
/// </summary>
public class PurifiedRecordEntryDto
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Place { get; set; } = string.Empty;
    public decimal InputWeight { get; set; }
    public decimal OutputWeight { get; set; }
    public decimal WeightLossKg { get; set; }
    public decimal WeightLossPercent { get; set; }
    public string PurifierName { get; set; } = string.Empty;
    public decimal PurifierFees { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public decimal SupervisorFees { get; set; }
    public decimal TotalCost { get; set; }
}

/// <summary>
/// Purified Stock Report: Purification stage details with all records grouped by category
/// </summary>
public class PurifiedStockReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    
    // All purified records grouped by category
    public List<PurifiedRecordEntryDto> Records { get; set; } = new();
    
    // Summary totals
    public decimal TotalInputWeight { get; set; }
    public decimal TotalOutputWeight { get; set; }
    public decimal TotalWeightLossKg { get; set; }
    public decimal TotalSupervisorFees { get; set; }
    public decimal TotalPurificationWorkerFees { get; set; }
    public decimal TotalPurificationCost { get; set; }
    
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Refinement Report: Refinement process details
/// </summary>
public class RefinementReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public DateTime RefinementDate { get; set; }
    public decimal InputWeight { get; set; }
    public decimal OutputWeight { get; set; }
    public decimal WeightLossKg { get; set; }
    public decimal WeightLossPercent { get; set; }

    // Per-worker details
    public List<WorkerFeeDetailDto> Workers { get; set; } = new();
    public decimal TotalRefinementFees { get; set; }

    public TimeSpan RefinementDuration { get; set; }
    public string Status { get; set; } = "Completed";
    public string QualityGrade { get; set; } = string.Empty;
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Individual refined record entry detail
/// </summary>
public class RefinedRecordEntryDto
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal InputWeight { get; set; }
    public decimal OutputWeight { get; set; }
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }
    public string RefinementWorkerName { get; set; } = string.Empty;
    public decimal WorkerFees { get; set; }
    public decimal TotalCost { get; set; }
}

/// <summary>
/// Refined Stock Report: Refinement details with all records and remaining inventory
/// </summary>
public class RefinedStockReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    
    // All refinement records
    public List<RefinedRecordEntryDto> Records { get; set; } = new();
    
    // Summary totals
    public decimal TotalInputWeight { get; set; }
    public decimal TotalOutputWeight { get; set; }
    public decimal TotalLostWeight { get; set; }
    public decimal TotalSpoilageWeight { get; set; }
    public decimal TotalReturnWeight { get; set; }
    public decimal TotalWorkerFees { get; set; }
    public decimal TotalRefinementCost { get; set; }
    
    // Remaining stock info
    public decimal AvailableWeightForExport { get; set; }
    public decimal WeightInStock { get; set; }
    public DateTime DateAvailable { get; set; }
    public string QualityStatus { get; set; } = string.Empty;
    public bool ReadyForExport { get; set; }
    public string? PendingProcesses { get; set; }
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Global Sorting Report: Final sorting before export with comprehensive worker details
/// </summary>
public class GlobalSortingReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public DateTime SortingDate { get; set; }
    public decimal InputWeightRefinedStock { get; set; }
    public decimal OutputWeightExported { get; set; }
    public decimal WeightLossKg { get; set; }
    public decimal WeightLossPercent { get; set; }

    // Sorting/Single-Double Drawn workers
    public List<WorkerFeeDetailDto> SortingWorkers { get; set; } = new();
    public decimal TotalSortingFees { get; set; }

    // Wash/Grading workers (if involved from original processing)
    public List<WorkerFeeDetailDto> WashGradingWorkers { get; set; } = new();
    public decimal TotalWashGradingFees { get; set; }

    // Summary
    public string FinalGradeCategory { get; set; } = string.Empty;
    public bool ExportReadyStatus { get; set; }
    public decimal TotalSortingCost { get; set; }
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Individual Single & Double Drawn record entry with size details
/// </summary>
public class SingleDoubleDrawnRecordEntryDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string Category { get; set; } = string.Empty;
    
    // Size and price details - Key-Value pairs for each size
    public List<SizeDetailDto> Sizes { get; set; } = new();
    
    // Weight details
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }
    
    // Worker information
    public string WorkerName { get; set; } = string.Empty;
    public decimal WorkerFees { get; set; }
    
    // Total amount (CNY) - sum of all (weight * price)
    public decimal TotalAmount { get; set; }
}

/// <summary>
/// Size detail for Single & Double Drawn (size name + weight + price)
/// </summary>
public class SizeDetailDto
{
    public string SizeName { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal Price { get; set; }
}

/// <summary>
/// Single & Double Drawn Report: Detailed size breakdown with pricing
/// </summary>
public class SingleDoubleDrawnReportDto
{
    public string MarkerName { get; set; } = string.Empty;
    
    // All single & double drawn records
    public List<SingleDoubleDrawnRecordEntryDto> Records { get; set; } = new();
    
    // Summary totals
    public decimal TotalWeight { get; set; }
    public decimal TotalLostWeight { get; set; }
    public decimal TotalSpoilageWeight { get; set; }
    public decimal TotalReturnWeight { get; set; }
    public decimal TotalWorkerFees { get; set; }
    public decimal TotalAmountCny { get; set; }
    
    public string? MissingDataWarning { get; set; }
}

/// <summary>
/// Complete report data for a single marker
/// </summary>
public class MarkerReportDataDto
{
    public string MarkerName { get; set; } = string.Empty;
    public int MarkerId { get; set; }

    public InventoryReportDto? InventoryReport { get; set; }
    public RawMaterialReportDto? RawMaterialReport { get; set; }
    public MessLabourReportDto? MessLabourReport { get; set; }
    public PurifiedStockReportDto? PurifiedStockReport { get; set; }
    public RefinementReportDto? RefinementReport { get; set; }
    public RefinedStockReportDto? RefinedStockReport { get; set; }
    public GlobalSortingReportDto? GlobalSortingReport { get; set; }
    public SingleDoubleDrawnReportDto? SingleDoubleDrawnReport { get; set; }
}

/// <summary>
/// Response with all report data for selected markers
/// </summary>
public class ReportDataResponseDto
{
    public DateTime GeneratedDate { get; set; } = DateTime.UtcNow.AddHours(6.5);
    public List<MarkerReportDataDto> MarkersData { get; set; } = new();
    public decimal? TotalWeightAllMarkers { get; set; }
    public decimal? TotalWorkerFeesAllMarkers { get; set; }
    public decimal? TotalCostAllMarkers { get; set; }
}
