namespace ERP_API.Models;

/// <summary>
/// A raw-material stock record — what we can consume without purchasing. Mirrors
/// the frontend inventory.types.js RawMaterialStock shape.
/// </summary>
public class RawMaterialStock
{
    public int Id { get; set; }                              // auto-increment PK
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Unit { get; set; } = "kg";
    public double OnHand { get; set; }
}
