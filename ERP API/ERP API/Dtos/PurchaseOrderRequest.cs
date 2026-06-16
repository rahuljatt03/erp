namespace ERP_API.Dtos;

/// <summary>
/// What a client sends to create or update a purchase order. Server-generated
/// fields (Id, PoNo, timestamps, CreatedBy) are intentionally absent.
/// </summary>
public class PurchaseOrderRequest
{
    public string SupplierName { get; set; } = string.Empty;
    public string? SupplierContact { get; set; }
    public string? Status { get; set; }
    public string OrderDate { get; set; } = string.Empty;
    public string? ExpectedDate { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseOrderItemRequest> Items { get; set; } = new();
}
