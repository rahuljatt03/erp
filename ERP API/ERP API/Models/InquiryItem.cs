using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>One product line on an inquiry. Stored in the inquiry_items table.</summary>
public class InquiryItem
{
    public int Id { get; set; }                              // auto-increment PK
    public string ProductName { get; set; } = default!;
    public string? ProductCode { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public string TargetDeliveryDate { get; set; } = "";     // yyyy-mm-dd
    public string? Remarks { get; set; }
    public List<RawMaterialRequirement> RawMaterials { get; set; } = new();

    // Foreign key back to the parent inquiry — hidden from the API JSON.
    [JsonIgnore]
    public int InquiryId { get; set; }
    [JsonIgnore]
    public Inquiry? Inquiry { get; set; }
}
