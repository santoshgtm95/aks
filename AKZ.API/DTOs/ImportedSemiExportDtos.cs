using System;

namespace AKZ.API.DTOs;

public class ImportedSemiExportDto
{
    public int Id { get; set; }
    public string MarkerName { get; set; } = string.Empty;
    public decimal TotalSortedWeight { get; set; }
    public DateTime Date { get; set; }
    public string DataJson { get; set; } = string.Empty;
}

public class CreateImportedSemiExportDto
{
    public string MarkerName { get; set; } = string.Empty;
    public decimal TotalSortedWeight { get; set; }
    public DateTime Date { get; set; }
    public string DataJson { get; set; } = string.Empty;
}