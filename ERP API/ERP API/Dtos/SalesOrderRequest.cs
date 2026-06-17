namespace ERP_API.Dtos;

/// <summary>
/// What a client sends to create or update a sales order. Server-generated
/// fields (Id, SoNo, timestamps, CreatedBy) are intentionally absent.
/// </summary>
public class SalesOrderRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerContact { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string OrderDate { get; set; } = string.Empty;
    public string? ExpectedDeliveryDate { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<SalesOrderItemRequest> Items { get; set; } = new();
}
