namespace ERP_API.Dtos;

/// <summary>One goods-receipt line: receive Qty units against purchase-order item ItemId.</summary>
public class ReceiptRequest
{
    public int ItemId { get; set; }
    public double Qty { get; set; }
}
