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
}
