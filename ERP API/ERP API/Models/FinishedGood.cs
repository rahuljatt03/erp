namespace ERP_API.Models;

/// <summary>
/// A finished-good stock record — what we can ship without building. Mirrors the
/// frontend inventory.types.js FinishedGood shape.
/// </summary>
public class FinishedGood
{
    public int Id { get; set; }                              // auto-increment PK
    public string Sku { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Unit { get; set; } = "pcs";
    public double OnHand { get; set; }
}
