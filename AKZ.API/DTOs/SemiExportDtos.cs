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

    // Prices
    public decimal PriceB { get; set; }
    public decimal Price28 { get; set; }
    public decimal Price26 { get; set; }
    public decimal Price24 { get; set; }
    public decimal Price22 { get; set; }
    public decimal Price20 { get; set; }
    public decimal Price18 { get; set; }
    public decimal Price16 { get; set; }
    public decimal Price14 { get; set; }
    public decimal Price12 { get; set; }
    public decimal Price10B { get; set; }
    public decimal Price10 { get; set; }
    public decimal Price9 { get; set; }
    public decimal Price8 { get; set; }
    public decimal Price7 { get; set; }
    public decimal Price6 { get; set; }
    public decimal PriceLeftover { get; set; }
    public decimal PriceSpoil { get; set; }

    public string Remark { get; set; } = string.Empty;
}

public class UpsertSemiExportRecordDto
{
    public int SingleDoubleDrawnRecordId { get; set; }
    public decimal PriceB { get; set; }
    public decimal Price28 { get; set; }
    public decimal Price26 { get; set; }
    public decimal Price24 { get; set; }
    public decimal Price22 { get; set; }
    public decimal Price20 { get; set; }
    public decimal Price18 { get; set; }
    public decimal Price16 { get; set; }
    public decimal Price14 { get; set; }
    public decimal Price12 { get; set; }
    public decimal Price10B { get; set; }
    public decimal Price10 { get; set; }
    public decimal Price9 { get; set; }
    public decimal Price8 { get; set; }
    public decimal Price7 { get; set; }
    public decimal Price6 { get; set; }
    public decimal PriceLeftover { get; set; }
    public decimal PriceSpoil { get; set; }
    public string Remark { get; set; } = string.Empty;
}
