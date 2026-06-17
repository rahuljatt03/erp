namespace ERP_API.Dtos;

/// <summary>One purchase-order line as sent by the client.</summary>
public class PurchaseOrderItemRequest
{
    // Identifies an existing line on update so the server can preserve its
    // server-owned ReceivedQty/PostedQty. Null/absent for brand-new lines.
    // (PostedQty itself is never accepted from the client — it is server-owned.)
    public int? Id { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string? MaterialCode { get; set; }
    public int? RawMaterialId { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public double UnitPrice { get; set; }
    public double ReceivedQty { get; set; }
}
