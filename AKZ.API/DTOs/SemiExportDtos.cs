using System;

namespace AKZ.API.DTOs;

public class SemiExportRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int SingleDoubleDrawnRecordId { get; set; }

    // Parent details
    public string RefinementRecordMarker { get; set; } = string.Empty;
    public string RefinementRecordCategory { get; set; } = string.Empty;
    public string RefinementRecordWarehouseName { get; set; } = string.Empty;

    public decimal WorkerFees { get; set; }
    public string Remark { get; set; } = string.Empty;
    public int? ExchangeRateId { get; set; }
    /// <summary>The CNY→MMK rate at the time this record was saved.</summary>
    public decimal? ExchangeRateRate { get; set; }
}

public class UpsertSemiExportRecordDto
{
    public int SingleDoubleDrawnRecordId { get; set; }
    public decimal WorkerFees { get; set; }
    public string Remark { get; set; } = string.Empty;
    public int? ExchangeRateId { get; set; }
}
