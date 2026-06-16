namespace ERP_API.Dtos;

/// <summary>One product line as sent by the client. No server-generated Id.</summary>
public class InquiryItemRequest
{
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public string? TargetDeliveryDate { get; set; }
    public string? Remarks { get; set; }
    public List<RawMaterialRequest> RawMaterials { get; set; } = new();
}
