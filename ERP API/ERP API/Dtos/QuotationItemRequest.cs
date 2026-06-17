namespace ERP_API.Dtos;

/// <summary>One quoted product line as sent by the client. No server-generated Id.</summary>
public class QuotationItemRequest
{
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public string? DeliveryDate { get; set; }
    public double UnitPrice { get; set; }
}
