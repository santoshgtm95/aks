using System;
using System.Collections.Generic;

namespace AKZ.API.DTOs;

public class LedgerDto
{
    public int Id { get; set; }
    public string LedgerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<LedgerMarkerDto> Markers { get; set; } = new List<LedgerMarkerDto>();
}

public class CreateLedgerDto
{
    public string LedgerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<LedgerMarkerDto> Markers { get; set; } = new List<LedgerMarkerDto>();
}

public class LedgerMarkerDto
{
    public int? ProductId { get; set; }
    public string MarkerName { get; set; } = string.Empty;
}
