using System;

namespace AKZ.API.DTOs;

public class SingleDoubleDrawnRecordDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int RefinementRecordId { get; set; }
    public string RefinementRecordMarker { get; set; } = string.Empty;
    public string RefinementRecordCategory { get; set; } = string.Empty;
    public string RefinementRecordWarehouseName { get; set; } = string.Empty;

    // Two Inches Category
    public decimal Size6 { get; set; }
    public decimal Size7 { get; set; }
    public decimal Size8 { get; set; }
    public decimal Size9 { get; set; }
    public decimal Size10 { get; set; }

    // B to Ten Category
    public decimal Size10B { get; set; }
    public decimal Size12 { get; set; }
    public decimal Size14 { get; set; }
    public decimal Size16 { get; set; }
    public decimal Size18 { get; set; }
    public decimal Size20 { get; set; }
    public decimal Size22 { get; set; }
    public decimal Size24 { get; set; }
    public decimal Size26 { get; set; }
    public decimal Size28 { get; set; }
    public decimal SizeBar { get; set; }

    // Weight tracking
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }
    /// <summary>LossWeight from the linked ProcessingRecord (Mess Labour lost weight in viss).</summary>
    public decimal ProcessingLossWeight { get; set; }
    /// <summary>ID of the linked ProcessingRecord — used by the frontend to deduplicate the loss weight across multiple SDD rows sharing the same ProcessingRecord.</summary>
    public int? ProcessingRecordId { get; set; }

    // Pricing for each size
    public decimal Price6 { get; set; }
    public decimal Price7 { get; set; }
    public decimal Price8 { get; set; }
    public decimal Price9 { get; set; }
    public decimal Price10 { get; set; }
    public decimal Price10B { get; set; }
    public decimal Price12 { get; set; }
    public decimal Price14 { get; set; }
    public decimal Price16 { get; set; }
    public decimal Price18 { get; set; }
    public decimal Price20 { get; set; }
    public decimal Price22 { get; set; }
    public decimal Price24 { get; set; }
    public decimal Price26 { get; set; }
    public decimal Price28 { get; set; }
    public decimal PriceBar { get; set; }

    // Two Inches Spoilage and Return sizes
    public decimal SpoilageSize { get; set; }
    public decimal ReturnSize { get; set; }
    public decimal PriceSpoilageSize { get; set; }
    public decimal PriceReturnSize { get; set; }
}

public class CreateSingleDoubleDrawnRecordDto
{
    public DateTime Date { get; set; }
    public int RefinementRecordId { get; set; }

    // Two Inches Category
    public decimal Size6 { get; set; }
    public decimal Size7 { get; set; }
    public decimal Size8 { get; set; }
    public decimal Size9 { get; set; }
    public decimal Size10 { get; set; }

    // B to Ten Category
    public decimal Size10B { get; set; }
    public decimal Size12 { get; set; }
    public decimal Size14 { get; set; }
    public decimal Size16 { get; set; }
    public decimal Size18 { get; set; }
    public decimal Size20 { get; set; }
    public decimal Size22 { get; set; }
    public decimal Size24 { get; set; }
    public decimal Size26 { get; set; }
    public decimal Size28 { get; set; }
    public decimal SizeBar { get; set; }

    // Weight tracking
    public decimal LostWeight { get; set; }
    public decimal SpoilageWeight { get; set; }
    public decimal ReturnWeight { get; set; }

    // Pricing for each size
    public decimal Price6 { get; set; }
    public decimal Price7 { get; set; }
    public decimal Price8 { get; set; }
    public decimal Price9 { get; set; }
    public decimal Price10 { get; set; }
    public decimal Price10B { get; set; }
    public decimal Price12 { get; set; }
    public decimal Price14 { get; set; }
    public decimal Price16 { get; set; }
    public decimal Price18 { get; set; }
    public decimal Price20 { get; set; }
    public decimal Price22 { get; set; }
    public decimal Price24 { get; set; }
    public decimal Price26 { get; set; }
    public decimal Price28 { get; set; }
    public decimal PriceBar { get; set; }

    // Two Inches Spoilage and Return sizes
    public decimal SpoilageSize { get; set; }
    public decimal ReturnSize { get; set; }
    public decimal PriceSpoilageSize { get; set; }
    public decimal PriceReturnSize { get; set; }
}
