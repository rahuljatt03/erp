namespace ERP_API.Dtos;

/// <summary>One purchase-order line as sent by the client. No server-generated Id.</summary>
public class PurchaseOrderItemRequest
{
    public string MaterialName { get; set; } = string.Empty;
    public string? MaterialCode { get; set; }
    public int? RawMaterialId { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public double UnitPrice { get; set; }
    public double ReceivedQty { get; set; }
}
