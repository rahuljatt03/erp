namespace ERP_API.Dtos;

/// <summary>Create a new finished-good record.</summary>
public class FinishedGoodRequest
{
    public string? Sku { get; set; }
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public double OnHand { get; set; }
}
