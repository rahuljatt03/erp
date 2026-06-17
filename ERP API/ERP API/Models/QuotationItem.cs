using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>One quoted product line, with offered pricing. Stored in quotation_items.</summary>
public class QuotationItem
{
    public int Id { get; set; }                              // auto-increment PK
    public string ProductName { get; set; } = default!;
    public string? ProductCode { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public string? DeliveryDate { get; set; }                // yyyy-mm-dd
    public double UnitPrice { get; set; }

    // Foreign key back to the parent quotation — hidden from the API JSON.
    [JsonIgnore]
    public int QuotationId { get; set; }
    [JsonIgnore]
    public Quotation? Quotation { get; set; }
}
