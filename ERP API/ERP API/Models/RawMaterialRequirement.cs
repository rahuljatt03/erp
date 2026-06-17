using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>
/// A raw material required for an inquiry product line. Stored in the
/// raw_material_requirements table.
/// </summary>
public class RawMaterialRequirement
{
    public int Id { get; set; }                              // auto-increment PK
    public string MaterialName { get; set; } = default!;
    public double Quantity { get; set; }
    public string Unit { get; set; } = "kg";
    public string? Notes { get; set; }

    // Foreign key back to the parent inquiry item — hidden from the API JSON.
    [JsonIgnore]
    public int InquiryItemId { get; set; }
    [JsonIgnore]
    public InquiryItem? InquiryItem { get; set; }
}
