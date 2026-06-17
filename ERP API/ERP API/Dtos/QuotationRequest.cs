namespace ERP_API.Dtos;

/// <summary>
/// What a client sends to create or update a quotation. Server-generated fields
/// (Id, QuoteNo, timestamps, CreatedBy) are intentionally absent.
/// </summary>
public class QuotationRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerContact { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string QuoteDate { get; set; } = string.Empty;
    public string? ValidUntil { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<QuotationItemRequest> Items { get; set; } = new();
}
