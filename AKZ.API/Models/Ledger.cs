using System;
using System.Collections.Generic;

namespace AKZ.API.Models;

public class Ledger : BaseEntity
{
    public int Id { get; set; }
    public string LedgerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public ICollection<LedgerMarker> Markers { get; set; } = new List<LedgerMarker>();
}
