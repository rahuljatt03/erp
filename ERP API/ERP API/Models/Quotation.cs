namespace ERP_API.Models;

/// <summary>
/// Quotation header — a priced offer to a customer. Line items live in the
/// related quotation_items table. Mirrors the frontend quotation.types.js shape.
/// </summary>
public class Quotation
{
    public int Id { get; set; }                              // auto-increment PK
    public string QuoteNo { get; set; } = default!;          // e.g. QT-2026-0001
    public string CustomerName { get; set; } = default!;
    public string? CustomerContact { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string QuoteDate { get; set; } = default!;        // yyyy-mm-dd
    public string? ValidUntil { get; set; }                  // yyyy-mm-dd
    public string Status { get; set; } = "draft";            // draft|sent|accepted|rejected|expired|converted
    public string? Notes { get; set; }
    public List<QuotationItem> Items { get; set; } = new();
    public string CreatedBy { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;        // ISO datetime
    public string UpdatedAt { get; set; } = default!;
}
