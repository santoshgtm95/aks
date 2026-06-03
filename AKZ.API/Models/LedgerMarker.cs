namespace AKZ.API.Models;

public class LedgerMarker : BaseEntity
{
    public int Id { get; set; }
    public int LedgerId { get; set; }
    public int? ProductId { get; set; }
    public string MarkerName { get; set; } = string.Empty;
    public Ledger Ledger { get; set; } = null!;
    public Product? Product { get; set; }
}
