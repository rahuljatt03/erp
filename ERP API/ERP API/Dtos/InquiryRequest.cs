namespace ERP_API.Dtos;

/// <summary>
/// What a client sends to create or update an inquiry. Server-generated fields
/// (Id, InquiryNo, timestamps, CreatedBy) are intentionally absent, so the
/// frontend's payload never conflicts with the database-assigned integer keys.
/// </summary>
public class InquiryRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerContact { get; set; }
    public string InquiryDate { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<InquiryItemRequest> Items { get; set; } = new();
}
