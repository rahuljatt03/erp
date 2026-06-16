using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>One ordered product line, with agreed pricing. Stored in sales_order_items.</summary>
public class SalesOrderItem
{
    public int Id { get; set; }                              // auto-increment PK
    public string ProductName { get; set; } = default!;
    public string? ProductCode { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public string? DeliveryDate { get; set; }                // yyyy-mm-dd
    public double UnitPrice { get; set; }

    // Foreign key back to the parent sales order — hidden from the API JSON.
    [JsonIgnore]
    public int SalesOrderId { get; set; }
    [JsonIgnore]
    public SalesOrder? SalesOrder { get; set; }
}
