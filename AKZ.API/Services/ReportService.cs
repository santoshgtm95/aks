using Microsoft.EntityFrameworkCore;
using AKZ.API.Data;
using AKZ.API.DTOs;
using AKZ.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AKZ.API.Services;

/// <summary>
/// Service for generating detailed marker reports across all processing stages
/// </summary>
public class ReportService
{
    private readonly AKZDbContext _context;

    public ReportService(AKZDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all markers that have been exported
    /// </summary>
    public async Task<List<ExportedMarkerDto>> GetExportedMarkersAsync()
    {
        try
        {
            var exportedMarkers = await _context.Exports
                .Where(e => e.DeleteFlg == 0)
                .Include(e => e.Ledger)
                    .ThenInclude(l => l.Markers)
                    .ThenInclude(m => m.Product)
                .SelectMany(e => e.Ledger.Markers.Where(m => m.DeleteFlg == 0 && m.Product != null),
                    (export, marker) => new ExportedMarkerDto
                    {
                        MarkerId = marker.Id,
                        MarkerName = marker.Product!.Marker,
                        ExportDate = export.Date,
                        TotalWeightExported = export.TotalExportWeightKg,
                        LedgerId = export.LedgerId,
                        LedgerName = export.Ledger.LedgerName,
                        ExportStatus = "Exported"
                    })
                .Distinct()
                .ToListAsync();

            return exportedMarkers;
        }
        catch (Exception ex)
        {
            throw new Exception("Error retrieving exported markers", ex);
        }
    }

    /// <summary>
    /// Generate comprehensive report data for selected markers
    /// </summary>
    public async Task<ReportDataResponseDto> GenerateReportDataAsync(ReportDataRequestDto request)
    {
        var response = new ReportDataResponseDto();

        foreach (var markerId in request.MarkerIds)
        {
            var markerData = new MarkerReportDataDto { MarkerId = markerId };

            // Get LedgerMarker and Product
            var ledgerMarker = await _context.LedgerMarkers
                .Where(m => m.Id == markerId && m.DeleteFlg == 0)
                .Include(m => m.Product)
                    .ThenInclude(p => p.Warehouse)
                .FirstOrDefaultAsync();

            if (ledgerMarker?.Product == null) continue;

            markerData.MarkerName = ledgerMarker.Product.Marker;
            var productId = ledgerMarker.ProductId ?? 0;
            if (productId == 0) continue;

            // Generate each report type as requested
            foreach (var reportType in request.ReportTypes)
            {
                switch (reportType)
                {
                    case "Inventory":
                        markerData.InventoryReport = await BuildInventoryReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "RawMaterial":
                        markerData.RawMaterialReport = await BuildRawMaterialReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "MessLabour":
                        markerData.MessLabourReport = await BuildMessLabourReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "PurifiedStock":
                        markerData.PurifiedStockReport = await BuildPurifiedStockReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "Refinement":
                        markerData.RefinementReport = await BuildRefinementReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "RefinedStock":
                        markerData.RefinedStockReport = await BuildRefinedStockReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "GlobalSorting":
                        markerData.GlobalSortingReport = await BuildGlobalSortingReportAsync(productId, ledgerMarker.Product);
                        break;
                    case "SingleDoubleDrawn":
                        markerData.SingleDoubleDrawnReport = await BuildSingleDoubleDrawnReportAsync(productId, ledgerMarker.Product);
                        break;
                }
            }

            response.MarkersData.Add(markerData);
        }

        // Calculate summary totals
        CalculateSummaryTotals(response);
        return response;
    }

    private async Task<InventoryReportDto> BuildInventoryReportAsync(int productId, Product product)
    {
        var report = new InventoryReportDto
        {
            MarkerName = product.Marker,
            RawMaterialUnit = product.Unit,
            RawMaterialCategory = product.Packages,
            SourceWarehouse = product.Warehouse?.Name ?? "Unknown",
            InitialRawMaterialWeight = product.Weight,
            StartDate = product.Date,
            EndDate = DateTime.UtcNow.AddHours(6.5),
            FinalExportedWeight = product.Weight,
            CompletionStatus = "Completed"
        };

        try
        {
            var processing = await _context.ProcessingRecords
                .Where(p => p.ProductId == productId && p.DeleteFlg == 0)
                .Include(p => p.WashGradingRecord)
                .FirstOrDefaultAsync();

            if (processing != null)
            {
                report.TotalWeightLossKg = processing.LossWeight;
                report.TotalWorkerFeesAllStages += processing.WorkerFees;

                if (processing.WashGradingRecord != null)
                {
                    report.TotalWeightLossKg += processing.WashGradingRecord.LostWeight;
                    report.TotalWorkerFeesAllStages += processing.WashGradingRecord.WorkerFees;
                }
            }

            report.TotalWeightLossPercent = report.InitialRawMaterialWeight > 0
                ? (report.TotalWeightLossKg / report.InitialRawMaterialWeight) * 100
                : 0;

            report.GrandTotalCostAllStages = report.TotalWorkerFeesAllStages + report.TotalSupervisorFeesAllStages;
        }
        catch (Exception)
        {
            // Log error but continue with partial data
        }

        return report;
    }

    private async Task<RawMaterialReportDto> BuildRawMaterialReportAsync(int productId, Product product)
    {
        var report = new RawMaterialReportDto
        {
            MarkerName = product.Marker,
            InputDate = product.Date,
            RawMaterialQuantity = product.Weight,
            Unit = product.Unit,
            Category = product.Packages,
            SourceWarehouse = product.Warehouse?.Name ?? string.Empty,
            ProcessingStartDate = product.Date,
            Status = "In Progress"
        };

        try
        {
            // Fetch sales history for this product/marker
            var sales = await _context.Sales
                .Where(s => s.ProductId == productId && s.DeleteFlg == 0)
                .OrderBy(s => s.Date)
                .ToListAsync();

            if (sales != null && sales.Any())
            {
                report.SalesHistory = sales.Select(s => new SalesHistoryDto
                {
                    Date = s.Date,
                    Weight = s.Weight,
                    Price = s.Price,
                    Total = s.Weight * s.Price,
                    CustomerName = s.CustomerName,
                    CustomerContact = s.CustomerContact,
                    Remark = s.Remark
                }).ToList();
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the report
            report.MissingDataWarning = $"Could not retrieve sales history: {ex.Message}";
        }

        return report;
    }

    private async Task<MessLabourReportDto> BuildMessLabourReportAsync(int productId, Product product)
    {
        var report = new MessLabourReportDto
        {
            MarkerName = product.Marker,
            Unit = product.Unit
        };

        try
        {
            var processing = await _context.ProcessingRecords
                .Where(p => p.ProductId == productId && p.DeleteFlg == 0)
                .Include(p => p.Workers)
                    .ThenInclude(w => w.Worker)
                .FirstOrDefaultAsync();

            if (processing != null)
            {
                report.ProcessingDate = processing.Date;
                report.QuantityProcessed = processing.TotalWeight;

                // Collect workers and calculate total from individual fees
                if (processing.Workers != null)
                {
                    foreach (var worker in processing.Workers)
                    {
                        report.Workers.Add(new WorkerFeeDetailDto
                        {
                            WorkerId = worker.MessLabourWorkerId,
                            WorkerName = worker.Worker?.Name ?? "Unknown",
                            FeeAmount = worker.WorkerFee
                        });
                        report.TotalWorkerFees += worker.WorkerFee;
                    }
                }

                report.FeePerUnitKg = processing.TotalWeight > 0
                    ? report.TotalWorkerFees / processing.TotalWeight
                    : 0;

                // Categorized Distribution
                report.RedWeight = processing.RedWeight;
                report.WhiteWeight = processing.WhiteWeight;
                report.SpecialWeight = processing.SpecialWeight;
                report.NaturalWeight = processing.NaturalWeight;
                report.NaturalWhiteWeight = processing.NaturalWhiteWeight;
                report.NaturalRedWeight = processing.NaturalRedWeight;
                report.ShortCutWeight = processing.ShortCutWeight;
                report.ArtificialWeight = processing.ArtificialWeight;
                report.ShortWeight = processing.ShortWeight;
                report.LossWeight = processing.LossWeight;
            }
        }
        catch (Exception)
        {
            // Log error but continue with partial data
        }

        return report;
    }

    private async Task<PurifiedStockReportDto> BuildPurifiedStockReportAsync(int productId, Product product)
    {
        var report = new PurifiedStockReportDto
        {
            MarkerName = product.Marker
        };

        try
        {
            var purifiedRecords = await _context.PurifiedRecords
                .Where(pf => pf.ProcessingRecord.ProductId == productId && pf.DeleteFlg == 0)
                .Include(pf => pf.Place)
                .Include(pf => pf.Purifier)
                .Include(pf => pf.PurificationWorkers)
                    .ThenInclude(pw => pw.Purifier)
                .OrderBy(pf => pf.Category)
                .ThenBy(pf => pf.Date)
                .ToListAsync();

            if (purifiedRecords.Count > 0)
            {
                foreach (var purified in purifiedRecords)
                {
                    // Collect all purifier names (from main Purifier and PurificationWorkers)
                    var purifierNames = new HashSet<string>();
                    if (purified.Purifier != null)
                    {
                        purifierNames.Add(purified.Purifier.Name);
                    }
                    
                    decimal purifierFeeSum = 0;
                    if (purified.PurificationWorkers != null && purified.PurificationWorkers.Count > 0)
                    {
                        foreach (var worker in purified.PurificationWorkers)
                        {
                            if (worker.Purifier != null && !purifierNames.Contains(worker.Purifier.Name))
                            {
                                purifierNames.Add(worker.Purifier.Name);
                            }
                            purifierFeeSum += worker.WorkerFees;
                        }
                    }

                    var entry = new PurifiedRecordEntryDto
                    {
                        Id = purified.Id,
                        Category = purified.Category,
                        Date = purified.Date,
                        Place = purified.Place?.Name ?? "Unknown",
                        InputWeight = purified.Weight,
                        OutputWeight = purified.RemainingWeight,
                        WeightLossKg = purified.Weight - purified.RemainingWeight,
                        WeightLossPercent = purified.Weight > 0
                            ? ((purified.Weight - purified.RemainingWeight) / purified.Weight) * 100
                            : 0,
                        PurifierName = purifierNames.Count > 0 ? string.Join(", ", purifierNames) : "Unknown",
                        PurifierFees = purifierFeeSum,
                        SupervisorName = purified.Place?.SupervisorName ?? "Unknown",
                        SupervisorFees = purified.SupervisorFees
                    };

                    entry.TotalCost = entry.SupervisorFees + entry.PurifierFees;

                    report.Records.Add(entry);

                    // Add to totals
                    report.TotalInputWeight += entry.InputWeight;
                    report.TotalOutputWeight += entry.OutputWeight;
                    report.TotalWeightLossKg += entry.WeightLossKg;
                    report.TotalSupervisorFees += entry.SupervisorFees;
                    report.TotalPurificationWorkerFees += entry.PurifierFees;
                }

                report.TotalPurificationCost = report.TotalSupervisorFees + report.TotalPurificationWorkerFees;
            }
            else
            {
                report.MissingDataWarning = "No purified records found";
            }
        }
        catch (Exception ex)
        {
            report.MissingDataWarning = $"Error: {ex.Message}";
        }

        return report;
    }

    private async Task<RefinementReportDto> BuildRefinementReportAsync(int productId, Product product)
    {
        var report = new RefinementReportDto
        {
            MarkerName = product.Marker
        };

        try
        {
            var refinement = await _context.RefinementRecords
                .Where(r => r.PurifiedRecord.ProcessingRecord.ProductId == productId && r.DeleteFlg == 0)
                .FirstOrDefaultAsync();

            if (refinement != null)
            {
                report.RefinementDate = refinement.Date;
                report.InputWeight = refinement.Weight;
                report.OutputWeight = refinement.RemainingWeight;
                report.WeightLossKg = refinement.LostWeight;
                report.WeightLossPercent = refinement.Weight > 0
                    ? (refinement.LostWeight / refinement.Weight) * 100
                    : 0;
                report.TotalRefinementFees = refinement.WorkerFees;

                if (refinement.Worker != null)
                {
                    report.Workers.Add(new WorkerFeeDetailDto
                    {
                        WorkerId = refinement.Worker.Id,
                        WorkerName = refinement.Worker.Name,
                        FeeAmount = refinement.WorkerFees
                    });
                }
            }
            else
            {
                report.MissingDataWarning = "No refinement record found";
            }
        }
        catch (Exception ex)
        {
            report.MissingDataWarning = $"Error: {ex.Message}";
        }

        return report;
    }

    private async Task<RefinedStockReportDto> BuildRefinedStockReportAsync(int productId, Product product)
    {
        var report = new RefinedStockReportDto
        {
            MarkerName = product.Marker,
            Records = new List<RefinedRecordEntryDto>()
        };

        try
        {
            // Fetch all refinement records with worker information
            var refinementRecords = await _context.RefinementRecords
                .Where(r => r.PurifiedRecord.ProcessingRecord.ProductId == productId && r.DeleteFlg == 0)
                .Include(r => r.Worker)
                .ToListAsync();

            if (refinementRecords.Any())
            {
                decimal totalInput = 0;
                decimal totalOutput = 0;
                decimal totalLost = 0;
                decimal totalSpoilage = 0;
                decimal totalReturn = 0;
                decimal totalWorkerFees = 0;

                foreach (var record in refinementRecords)
                {
                    var workerName = record.Worker?.Name ?? "Unknown";
                    // InputWeight = RemainingWeight + LostWeight + ReturnWeight + SpoilageWeight
                    var inputWeight = record.RemainingWeight + record.LostWeight + record.ReturnWeight + record.SpoilageWeight;
                    // OutputWeight = RemainingWeight
                    var outputWeight = record.RemainingWeight;
                    var totalCost = record.WorkerFees;

                    report.Records.Add(new RefinedRecordEntryDto
                    {
                        Id = record.Id,
                        Category = record.Category,
                        Date = record.Date,
                        InputWeight = inputWeight,
                        OutputWeight = outputWeight,
                        LostWeight = record.LostWeight,
                        SpoilageWeight = record.SpoilageWeight,
                        ReturnWeight = record.ReturnWeight,
                        RefinementWorkerName = workerName,
                        WorkerFees = record.WorkerFees,
                        TotalCost = totalCost
                    });

                    totalInput += inputWeight;
                    totalOutput += outputWeight;
                    totalLost += record.LostWeight;
                    totalSpoilage += record.SpoilageWeight;
                    totalReturn += record.ReturnWeight;
                    totalWorkerFees += record.WorkerFees;
                }

                // Set summary totals
                report.TotalInputWeight = totalInput;
                report.TotalOutputWeight = totalOutput;
                report.TotalLostWeight = totalLost;
                report.TotalSpoilageWeight = totalSpoilage;
                report.TotalReturnWeight = totalReturn;
                report.TotalWorkerFees = totalWorkerFees;
                report.TotalRefinementCost = totalWorkerFees;

                // Get the latest record's remaining weight for stock info
                var latestRecord = refinementRecords.OrderByDescending(r => r.Date).First();
                report.AvailableWeightForExport = latestRecord.RemainingWeight;
                report.WeightInStock = latestRecord.RemainingWeight;
                report.DateAvailable = latestRecord.Date;
                report.ReadyForExport = true;
            }
            else
            {
                report.MissingDataWarning = "No refinement records found";
            }
        }
        catch (Exception ex)
        {
            report.MissingDataWarning = $"Error: {ex.Message}";
        }

        return report;
    }

    private async Task<GlobalSortingReportDto> BuildGlobalSortingReportAsync(int productId, Product product)
    {
        var report = new GlobalSortingReportDto
        {
            MarkerName = product.Marker
        };

        try
        {
            var sorting = await _context.SingleDoubleDrawnRecords
                .Where(s => s.RefinementRecord.PurifiedRecord.ProcessingRecord.ProductId == productId && s.DeleteFlg == 0)
                .FirstOrDefaultAsync();

            if (sorting != null)
            {
                report.SortingDate = sorting.Date;
                report.WeightLossKg = sorting.LostWeight;
                report.ExportReadyStatus = true;
            }
        }
        catch (Exception)
        {
            // Log error but continue with partial data
        }

        return report;
    }

    private async Task<SingleDoubleDrawnReportDto> BuildSingleDoubleDrawnReportAsync(int productId, Product product)
    {
        var report = new SingleDoubleDrawnReportDto
        {
            MarkerName = product.Marker,
            Records = new List<SingleDoubleDrawnRecordEntryDto>()
        };

        try
        {
            // Fetch all Single & Double Drawn records with worker information
            var records = await _context.SingleDoubleDrawnRecords
                .Where(s => s.RefinementRecord.PurifiedRecord.ProcessingRecord.ProductId == productId && s.DeleteFlg == 0)
                .Include(s => s.Worker)
                .ToListAsync();

            if (records.Any())
            {
                decimal totalWeight = 0;
                decimal totalLostWeight = 0;
                decimal totalSpoilageWeight = 0;
                decimal totalReturnWeight = 0;
                decimal totalWorkerFees = 0;
                decimal totalAmountCny = 0;

                foreach (var record in records)
                {
                    var workerName = record.Worker?.Name ?? "Unknown";
                    var sizes = new List<SizeDetailDto>();

                    // Collect all sizes with weight and price (Two Inches category)
                    if (record.Size6 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 6", Weight = record.Size6, Price = record.Price6 });
                    if (record.Size7 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 7", Weight = record.Size7, Price = record.Price7 });
                    if (record.Size8 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 8", Weight = record.Size8, Price = record.Price8 });
                    if (record.Size9 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 9", Weight = record.Size9, Price = record.Price9 });
                    if (record.Size10 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 10", Weight = record.Size10, Price = record.Price10 });

                    // B to Ten category
                    if (record.Size10B > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 10B", Weight = record.Size10B, Price = record.Price10B });
                    if (record.Size12 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 12", Weight = record.Size12, Price = record.Price12 });
                    if (record.Size14 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 14", Weight = record.Size14, Price = record.Price14 });
                    if (record.Size16 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 16", Weight = record.Size16, Price = record.Price16 });
                    if (record.Size18 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 18", Weight = record.Size18, Price = record.Price18 });
                    if (record.Size20 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 20", Weight = record.Size20, Price = record.Price20 });
                    if (record.Size22 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 22", Weight = record.Size22, Price = record.Price22 });
                    if (record.Size24 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 24", Weight = record.Size24, Price = record.Price24 });
                    if (record.Size26 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 26", Weight = record.Size26, Price = record.Price26 });
                    if (record.Size28 > 0) sizes.Add(new SizeDetailDto { SizeName = "Size 28", Weight = record.Size28, Price = record.Price28 });
                    if (record.SizeBar > 0) sizes.Add(new SizeDetailDto { SizeName = "Size Bar", Weight = record.SizeBar, Price = record.PriceBar });

                    // Calculate total amount (sum of weight * price for each size)
                    var recordTotalAmount = sizes.Sum(s => s.Weight * s.Price);

                    report.Records.Add(new SingleDoubleDrawnRecordEntryDto
                    {
                        Id = record.Id,
                        Date = record.Date,
                        Category = "Single & Double Drawn",
                        CategoryColor = record.RefinementRecord?.Category ?? "Unknown",
                        Sizes = sizes,
                        LostWeight = record.LostWeight,
                        SpoilageWeight = record.SpoilageWeight,
                        ReturnWeight = record.ReturnWeight,
                        WorkerName = workerName,
                        WorkerFees = record.WorkerFees,
                        TotalAmount = recordTotalAmount
                    });

                    // Accumulate totals
                    totalWeight += sizes.Sum(s => s.Weight);
                    totalLostWeight += record.LostWeight;
                    totalSpoilageWeight += record.SpoilageWeight;
                    totalReturnWeight += record.ReturnWeight;
                    totalWorkerFees += record.WorkerFees;
                    totalAmountCny += recordTotalAmount;
                }

                // Set summary totals
                report.TotalWeight = totalWeight;
                report.TotalLostWeight = totalLostWeight;
                report.TotalSpoilageWeight = totalSpoilageWeight;
                report.TotalReturnWeight = totalReturnWeight;
                report.TotalWorkerFees = totalWorkerFees;
                report.TotalAmountCny = totalAmountCny;
            }
            else
            {
                report.MissingDataWarning = "No Single & Double Drawn records found";
            }
        }
        catch (Exception ex)
        {
            report.MissingDataWarning = $"Error: {ex.Message}";
        }

        return report;
    }

    private void CalculateSummaryTotals(ReportDataResponseDto response)
    {
        response.TotalWeightAllMarkers = response.MarkersData
            .Where(m => m.InventoryReport != null)
            .Sum(m => m.InventoryReport!.FinalExportedWeight);

        response.TotalWorkerFeesAllMarkers = response.MarkersData
            .Where(m => m.InventoryReport != null)
            .Sum(m => m.InventoryReport!.TotalWorkerFeesAllStages);

        response.TotalCostAllMarkers = response.MarkersData
            .Where(m => m.InventoryReport != null)
            .Sum(m => m.InventoryReport!.GrandTotalCostAllStages);
    }
}
