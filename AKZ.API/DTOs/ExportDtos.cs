using System;
using System.Collections.Generic;

namespace AKZ.API.DTOs;

public class ExportDto
{
    public int Id { get; set; }
    public int LedgerId { get; set; }
    public string LedgerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string SelectedColors { get; set; } = string.Empty;
    public decimal SelectedWeight { get; set; }
    public decimal TotalExportWeightViss { get; set; }
    public decimal TotalExportWeightKg { get; set; }
    public decimal ProductAmountMMK { get; set; }
    public decimal ProductAmountCNY { get; set; }
    public decimal WorkerFees { get; set; }
    public decimal GrandTotalMMK { get; set; }
    public int? ExchangeRateId { get; set; }
    public decimal? ExchangeRateRate { get; set; }
    public decimal SellingPrice { get; set; }
}

public class CreateExportDto
{
    public int LedgerId { get; set; }
    public DateTime Date { get; set; }
    public string SelectedColors { get; set; } = string.Empty;
    public decimal SelectedWeight { get; set; }
    public decimal TotalExportWeightViss { get; set; }
    public decimal TotalExportWeightKg { get; set; }
    public decimal ProductAmountMMK { get; set; }
    public decimal ProductAmountCNY { get; set; }
    public decimal WorkerFees { get; set; }
    public decimal GrandTotalMMK { get; set; }
    public int? ExchangeRateId { get; set; }
    public decimal SellingPrice { get; set; }
}
